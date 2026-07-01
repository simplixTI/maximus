import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Wrench } from "lucide-react";
import logo from "@/assets/logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-2 flex flex-col items-center"
      >
        <img
          src={logo}
          alt="Maximus Solutions Group"
          className="mb-4 h-48 w-48 object-contain sm:h-56 sm:w-56"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-16 text-lg text-muted-foreground"
      >
        Your property, our expertise.
      </motion.p>

      {/* Role Selection */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <button
          onClick={() => navigate("/client/signup")}
          className="group flex w-full items-center gap-4 rounded-2xl bg-gradient-orange px-6 py-5 text-left font-display text-lg font-semibold text-accent-foreground shadow-orange transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-foreground/20">
            <Home className="h-6 w-6" />
          </div>
          <div>
            <div>I need a service</div>
            <div className="text-sm font-normal opacity-80">Find trusted professionals</div>
          </div>
        </button>

        <button
          onClick={() => navigate("/provider/onboarding")}
          className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card px-6 py-5 text-left font-display text-lg font-semibold text-foreground transition-all hover:border-accent hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Wrench className="h-6 w-6 text-accent" />
          </div>
          <div>
            <div>I'm a provider</div>
            <div className="text-sm font-normal text-muted-foreground">Join our network</div>
          </div>
        </button>
      </motion.div>

      {/* Sign In link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8"
      >
        <button
          onClick={() => navigate("/login")}
          className="font-display text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
        >
          Already have an account? <span className="text-accent">Sign In</span>
        </button>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-auto pt-12 text-xs text-muted-foreground"
      >
        © 2026 Maximus Solutions Group. All rights reserved.
      </motion.p>
    </div>
  );
};

export default Index;
