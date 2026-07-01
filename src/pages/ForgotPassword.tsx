import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    setSent(true);
    toast.success("Check your email for a reset link");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <button onClick={() => navigate("/login")} className="rounded-xl p-2 hover:bg-secondary">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="font-display text-lg font-semibold text-foreground">Reset Password</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 px-6 py-8"
      >
        <div className="mb-8 flex justify-center">
          <img src={logo} alt="Maximus Solutions Group" className="h-28 w-28 object-contain" />
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <Mail className="mx-auto h-8 w-8 text-accent" />
            <h3 className="mt-3 font-display text-lg font-semibold text-foreground">Check your inbox</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a password reset link to <span className="text-foreground">{email}</span>.
              Click the link to choose a new password.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="mt-6 h-12 w-full rounded-xl bg-gradient-orange font-display font-semibold text-accent-foreground"
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Enter your account email and we'll send you a link to reset your password.
            </p>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 text-sm text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pl-10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={loading || !email}
              className="mt-8 h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <button onClick={() => navigate("/login")} className="text-accent hover:underline">
                Sign in
              </button>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
