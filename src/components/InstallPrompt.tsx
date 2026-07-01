import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function InstallPrompt() {
  const { canInstall, shouldOfferBanner, platform, promptInstall, dismiss } = usePWAInstall();
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === "/install") return null;
  if (!shouldOfferBanner) return null;

  const handleInstall = async () => {
    if (canInstall) {
      const r = await promptInstall();
      if (r.outcome === "accepted") toast.success("Installing…");
      else if (r.outcome === "dismissed") dismiss();
    } else {
      navigate("/install");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed left-4 right-4 bottom-24 z-50 mx-auto max-w-md pointer-events-none"
      >
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-accent/40 bg-gradient-to-br from-background/95 to-background/80 p-4 shadow-orange backdrop-blur-lg">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-orange">
            <Download className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install the Maximus app</p>
            <p className="text-xs text-muted-foreground">
              {platform === "ios"
                ? "Add to Home Screen for the full app experience"
                : "One tap. Home-screen icon. Offline-ready."}
            </p>
          </div>
          <button
            onClick={handleInstall}
            className="shrink-0 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground transition-transform hover:scale-105 active:scale-95"
          >
            Install
          </button>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
