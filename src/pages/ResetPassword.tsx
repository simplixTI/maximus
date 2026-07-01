import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Password updated");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <button onClick={() => navigate("/login")} className="rounded-xl p-2 hover:bg-secondary">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="font-display text-lg font-semibold text-foreground">Set New Password</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 px-6 py-8"
      >
        <div className="mb-8 flex justify-center">
          <img src={logo} alt="Maximus Solutions Group" className="h-28 w-28 object-contain" />
        </div>

        {!ready ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <KeyRound className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-semibold text-foreground">Recovery link required</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Open the password reset link from your email to set a new password.
            </p>
            <Button
              onClick={() => navigate("/forgot-password")}
              className="mt-6 h-12 w-full rounded-xl bg-gradient-orange font-display font-semibold text-accent-foreground"
            >
              Request a new link
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Choose a new password for your account.
            </p>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 text-sm text-muted-foreground">New Password</Label>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pr-10 text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 text-sm text-muted-foreground">Confirm Password</Label>
                <Input
                  type={show ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-12 rounded-xl border-border bg-card text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={loading || !password || !confirm}
              className="mt-8 h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
