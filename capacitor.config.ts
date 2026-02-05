import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bateria.app",
  appName: "social-battery",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      // COLE SEU CLIENT ID AQUI ABAIXO (MANTENHA AS ASPAS)
      serverClientId:
        "990994147026-grnttkd1j4bc10rpbaprb9rd05hoplou.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
