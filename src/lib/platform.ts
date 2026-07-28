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
export const APP_HTTPS_ORIGIN = "https://www.maximussolutions.app";
export const AUTH_CALLBACK_PATH = "/auth/callback";
export const AUTH_CALLBACK_URL = `${APP_HTTPS_ORIGIN}${AUTH_CALLBACK_PATH}`;

/**
 * Returns the canonical HTTPS redirect URL used by Supabase auth.
 * The same URL is used on web (browser navigates there) and Android
 * (App Link verified via assetlinks.json opens the app instead of
 * the browser). Custom-scheme deep links are no longer used.
 */
export const getAuthRedirectUrl = (path: string = AUTH_CALLBACK_PATH): string => {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${APP_HTTPS_ORIGIN}${clean}`;
};
