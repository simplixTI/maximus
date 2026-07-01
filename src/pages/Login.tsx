import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, session, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session || !role) return;
    if (role === "client") navigate("/client/dashboard", { replace: true });
    else if (role === "provider") navigate("/provider/dashboard", { replace: true });
    else if (role === "admin") navigate("/admin", { replace: true });
  }, [session, role, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await signIn(email.toLowerCase().trim(), password);
    setLoading(false);
    if (error) toast.error(error);
    else toast.success("Signed in");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <button onClick={() => navigate("/")} className="rounded-xl p-2 hover:bg-secondary">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="font-display text-lg font-semibold text-foreground">Sign In</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 px-6 py-8"
      >
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img src={logo} alt="Maximus Solutions Group" className="h-28 w-28 object-contain" />
        </div>

        {/* OAuth */}
        <div className="mb-6 flex flex-col gap-3">
          <Button variant="outline" className="h-13 w-full gap-3 rounded-xl border-border bg-card text-foreground py-4">
            <img src="https://www.google.com/favicon.ico" alt="" className="h-5 w-5" />
            Continue with Google
          </Button>
          <Button variant="outline" className="h-13 w-full gap-3 rounded-xl border-border bg-card text-foreground py-4">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            Continue with Apple
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">or sign in with email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Form */}
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

          <div>
            <Label className="mb-1.5 text-sm text-muted-foreground">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-border bg-card pr-10 text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 text-right">
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-sm text-accent hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <Button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className="mt-6 h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button onClick={() => navigate("/client/signup")} className="text-accent hover:underline">Sign up</button>
        </p>

      </motion.div>
    </div>
  );
};

export default Login;
