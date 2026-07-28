import { Capacitor } from "@capacitor/core";

export const isCapacitorNative = (): boolean =>
  typeof Capacitor !== "undefined" && Capacitor.isNativePlatform();

export const isAndroid = (): boolean =>
  isCapacitorNative() && Capacitor.getPlatform() === "android";

export const isIos = (): boolean =>
  isCapacitorNative() && Capacitor.getPlatform() === "ios";

export const isCapacitorBuild = (): boolean =>
  import.meta.env.VITE_CAPACITOR === "1" || isCapacitorNative();

export const APP_URL_SCHEME = "com.maximussolutions.app";
export const APP_HTTPS_ORIGIN = "https://maximussolutions.app";
export const APP_ANDROID_ORIGIN = "https://app.maximussolutions.app";

export const getAuthRedirectUrl = (path: string): string => {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (isCapacitorNative()) {
    return `${APP_URL_SCHEME}://auth/callback?next=${encodeURIComponent(clean)}`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}${clean}`;
  }
  return `${APP_HTTPS_ORIGIN}${clean}`;
};
