import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bateria.app",
  appName: "Social Battery",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId:
        "990994147026-grnttkd1j4bc10rpbaprb9rd05hoplou.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
