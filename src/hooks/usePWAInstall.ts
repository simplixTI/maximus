import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "ios" | "android" | "desktop" | "unknown";

const DISMISS_KEY = "pwa_install_dismissed_at";
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/windows|macintosh|linux/i.test(ua)) return "desktop";
  return "unknown";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = new Date(raw).getTime();
    return Number.isFinite(ts) && Date.now() - ts < DISMISS_WINDOW_MS;
  } catch {
    return false;
  }
}

export function usePWAInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(isStandalone());
  const [platform] = useState<Platform>(detectPlatform());
  const [dismissed, setDismissed] = useState<boolean>(recentlyDismissed());

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return { outcome: "unavailable" as const };
    await deferred.prompt();
    const result = await deferred.userChoice;
    setDeferred(null);
    if (result.outcome === "accepted") setInstalled(true);
    return result;
  }, [deferred]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setDismissed(true);
  }, []);

  const canInstall = !installed && !!deferred;
  const shouldOfferBanner = !installed && !dismissed && (!!deferred || platform === "ios");

  return { canInstall, installed, platform, promptInstall, dismiss, shouldOfferBanner };
}
