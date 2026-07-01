import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Share, Plus, CheckCircle2, Smartphone, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const Install = () => {
  const navigate = useNavigate();
  const { canInstall, installed, platform, promptInstall } = usePWAInstall();

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result.outcome === "accepted") toast.success("Installing Maximus…");
    else if (result.outcome === "dismissed") toast("Maybe next time");
    else toast("Install not available right now — follow the manual steps below");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <button onClick={() => navigate(-1)} className="rounded-xl p-2 hover:bg-secondary">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="font-display text-lg font-semibold text-foreground">Install Maximus</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 px-6 py-10"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-orange opacity-30 blur-2xl" />
            <img src={logo} alt="Maximus" className="relative h-28 w-28 rounded-3xl object-contain" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Get the app</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Install Maximus on your device for one-tap access, offline browsing, and faster job requests.
          </p>
        </div>

        {installed ? (
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-green-500" />
            <div>
              <p className="font-semibold text-foreground">Already installed</p>
              <p className="text-xs text-muted-foreground">Open Maximus from your home screen.</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md space-y-6">
            {canInstall && (
              <Button
                onClick={handleInstall}
                className="h-14 w-full gap-2 rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Download className="h-5 w-5" />
                Install now
              </Button>
            )}

            {platform === "ios" && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-accent" />
                  <p className="font-display font-semibold text-foreground">On iPhone / iPad</p>
                </div>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">1</span>
                    <span>Open this page in <b>Safari</b> (not Chrome).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">2</span>
                    <span className="flex items-center gap-1">
                      Tap the <Share className="inline h-4 w-4 text-accent" /> <b>Share</b> button.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">3</span>
                    <span className="flex items-center gap-1">
                      Choose <Plus className="inline h-4 w-4 text-accent" /> <b>Add to Home Screen</b>.
                    </span>
                  </li>
                </ol>
              </div>
            )}

            {platform === "android" && !canInstall && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-accent" />
                  <p className="font-display font-semibold text-foreground">On Android</p>
                </div>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li>Open the browser's <b>menu (⋮)</b>.</li>
                  <li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
                  <li>Confirm to install.</li>
                </ol>
              </div>
            )}

            {platform === "desktop" && !canInstall && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <MonitorSmartphone className="h-5 w-5 text-accent" />
                  <p className="font-display font-semibold text-foreground">On Desktop</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the <b>install</b> icon in your browser's address bar (Chrome/Edge). If you don't see it,
                  your browser may not support installation yet.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
              <p className="font-display text-sm font-semibold text-accent">Native apps coming soon</p>
              <p className="mt-1 text-xs text-muted-foreground">
                We're building iOS and Android apps for the App Store and Google Play. Meanwhile, the installed
                web app gives you the same look-and-feel.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Install;
