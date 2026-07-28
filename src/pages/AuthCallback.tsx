import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Handles the OAuth callback on the web.
 *
 * Supabase is configured with detectSessionInUrl: true, so when the browser
 * loads /auth/callback?code=..., Supabase auto-exchanges the code and updates
 * the session. This page just waits for that session to appear and then sends
 * the user to /, where role-based routing takes over.
 *
 * On Android the App Link opens the app directly and AuthContext's appUrlOpen
 * listener performs the exchange — this component is not rendered there.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [params] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const err = params.get("error_description") || params.get("error");
    if (err) {
      setErrorMsg(err);
      return;
    }
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session, params, navigate]);

  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm space-y-4 text-center">
          <h1 className="font-display text-xl font-bold text-foreground">Sign-in failed</h1>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <button
            className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => navigate("/login", { replace: true })}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">
        {loading ? "Finishing sign-in…" : "Redirecting…"}
      </div>
    </div>
  );
}
