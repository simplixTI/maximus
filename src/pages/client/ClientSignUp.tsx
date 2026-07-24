import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Phone, User, MapPin, Camera, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const ClientSignUp = () => {
  const navigate = useNavigate();
  const { signUp, signInWithOAuth } = useAuth();

  const handleOAuth = async (provider: "google" | "apple") => {
    const { error } = await signInWithOAuth(provider);
    if (error) toast.error(error);
  };
  const [step, setStep] = useState<"form" | "success">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.includes("@")) e.email = "Valid email is required";
    if (form.phone.replace(/\D/g, "").length < 10) e.phone = "Valid phone number is required";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (!form.address.trim()) e.address = "Address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    const { error } = await signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      fullName: form.fullName.trim(),
      phone: form.phone,
      role: "client",
    });
    if (error) {
      setSubmitting(false);
      toast.error(error);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from("client_profiles").upsert({
        user_id: userData.user.id,
        address: form.address.trim(),
      });
    }
    setSubmitting(false);
    setStep("success");
    setTimeout(() => navigate("/client/dashboard"), 1500);
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <button onClick={() => navigate(-1)} className="rounded-xl p-2 hover:bg-secondary">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="font-display text-lg font-semibold text-foreground">Create Account</h2>
      </div>

      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-y-auto px-6 py-6"
          >
            {/* OAuth */}
            <div className="mb-6 flex flex-col gap-3">
              <Button onClick={() => handleOAuth("google")} variant="outline" className="h-13 w-full gap-3 rounded-xl border-border bg-card text-foreground py-4">
                <img src="https://www.google.com/favicon.ico" alt="" className="h-5 w-5" />
                Continue with Google
              </Button>
              <Button onClick={() => handleOAuth("apple")} variant="outline" className="h-13 w-full gap-3 rounded-xl border-border bg-card text-foreground py-4">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Continue with Apple
              </Button>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">or sign up with email</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Profile Photo */}
            <div className="mb-6 flex justify-center">
              <button className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary transition-colors hover:border-accent">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 text-sm text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pl-10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>}
              </div>

              <div>
                <Label className="mb-1.5 text-sm text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pl-10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>

              <div>
                <Label className="mb-1.5 text-sm text-muted-foreground">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pl-10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
              </div>

              <div>
                <Label className="mb-1.5 text-sm text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
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
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
              </div>

              <div>
                <Label className="mb-1.5 text-sm text-muted-foreground">Home / Billing Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="123 Main St, City, State"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pl-10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-8 h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create Account"}
            </Button>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button onClick={() => navigate("/login")} className="text-accent hover:underline">Sign in</button>
            </p>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 flex-col items-center justify-center px-6"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-orange shadow-orange">
              <svg className="h-10 w-10 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">You're all set!</h2>
            <p className="mt-2 text-muted-foreground">Redirecting to your dashboard...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientSignUp;
