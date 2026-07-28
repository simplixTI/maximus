import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.maximussolutions.app",
  appName: "Maximus Solutions",
  webDir: "dist",
  server: {
    androidScheme: "https",
    hostname: "app.maximussolutions.app",
    allowNavigation: [
      "maximussolutions.app",
      "*.maximussolutions.app",
      "kcryjyznkxaoclrmbadi.supabase.co",
      "*.supabase.co",
      "accounts.google.com",
      "*.googleusercontent.com",
    ],
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#000000",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    Geolocation: {
      permissions: {
        location: "when-in-use",
      },
    },
  },
};

export default config;
