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
        "20810139231-jf4mqi179q2ptdn138mgsig04m7s7a4k.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
