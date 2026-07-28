import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { App as CapApp, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/lib/database.types";
import { sendTransactionalEmail } from "@/lib/email";
import { sendTransactionalSMS } from "@/lib/sms";
import { insertNotification } from "@/hooks/notifications";
import { isCapacitorNative, getAuthRedirectUrl, AUTH_CALLBACK_URL } from "@/lib/platform";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: "google" | "apple") => Promise<{ error: string | null }>;
  signUp: (args: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: UserRole;
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const CALLBACK_PREFIX = AUTH_CALLBACK_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setRole(null);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isCapacitorNative()) return;

    const handleUrl = async (event: URLOpenListenerEvent) => {
      const url = event?.url;
      if (!url || !url.startsWith(CALLBACK_PREFIX)) return;
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get("code");
        const errorCode = parsed.searchParams.get("error");
        const errorDesc = parsed.searchParams.get("error_description");
        if (errorCode) {
          console.warn("OAuth callback error:", errorCode, errorDesc);
          await Browser.close().catch(() => undefined);
          return;
        }
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn("exchangeCodeForSession failed:", error.message);
          } else if (data?.session) {
            setSession(data.session);
          }
          await Browser.close().catch(() => undefined);
        }
      } catch (e) {
        console.warn("Deep link handler failed:", e);
      }
    };

    let removeHandle: (() => void) | undefined;
    CapApp.addListener("appUrlOpen", handleUrl)
      .then((h) => {
        removeHandle = () => h.remove();
      })
      .catch(() => undefined);
    return () => {
      removeHandle?.();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setRole(data.role);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const signIn: AuthState["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithOAuth: AuthState["signInWithOAuth"] = async (provider) => {
    const redirectTo = getAuthRedirectUrl();
    const native = isCapacitorNative();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: native,
      },
    });
    if (error) return { error: error.message };
    if (native && data?.url) {
      try {
        await Browser.open({ url: data.url, presentationStyle: "popover" });
      } catch (e) {
        console.warn("Browser.open failed:", e);
        return { error: "Unable to open browser for sign-in." };
      }
    }
    return { error: null };
  };

  const signUp: AuthState["signUp"] = async ({
    email,
    password,
    fullName,
    phone,
    role: signupRole = "client",
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, signup_role: signupRole } },
    });
    if (error) return { error: error.message };

    if (data.user) {
      const updates: Record<string, unknown> = { full_name: fullName, phone };
      if (signupRole !== "client") updates.role = signupRole;
      await supabase.from("profiles").update(updates).eq("id", data.user.id);

      const first = fullName.split(" ")[0];
      if (email) {
        sendTransactionalEmail({ to: email, template: "welcome", data: { name: first } });
      }
      if (phone) {
        sendTransactionalSMS({ to: phone, template: "welcome", data: { name: first } });
      }
      insertNotification({
        user_id: data.user.id,
        type: "welcome",
        title: `Welcome${first ? `, ${first}` : ""}!`,
        body: "Your account is ready. Request a service anytime from the app.",
      });
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword: AuthState["resetPassword"] = async (email) => {
    const redirectTo = getAuthRedirectUrl("/reset-password");
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo,
    });
    return { error: error?.message ?? null };
  };

  const updatePassword: AuthState["updatePassword"] = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        loading,
        signIn,
        signInWithOAuth,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
