import type { CapacitorConfig } from "@capacitor/cli";

// Same static export (out/) as the web app. ios/ is committed (Xcode project); android: npx cap add android (see README).
const config: CapacitorConfig = {
  appId: "com.purmethod.cyclemax",
  appName: "Cyclemax",
  webDir: "out",
  backgroundColor: "#FFFFFF",
  ios: { contentInset: "never", backgroundColor: "#FFFFFF" },
  android: { backgroundColor: "#FFFFFF" },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#FFFFFF",
      showSpinner: false,
      launchAutoHide: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_cyclemax",
      iconColor: "#8A0303",
    },
  },
};

export default config;
