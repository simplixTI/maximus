import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/lib/database.types";
import { sendTransactionalEmail } from "@/lib/email";
import { sendTransactionalSMS } from "@/lib/sms";
import { insertNotification } from "@/hooks/notifications";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (args: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: UserRole;
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

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
        sendTransactionalEmail({ to: email, template: "generic", subject: "Welcome to Maximus", data: { body: `Hi ${first}, your account is ready. Request a service anytime from the app.` } });
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

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, role, loading, signIn, signUp, signOut }}
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
