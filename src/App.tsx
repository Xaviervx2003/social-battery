import React, { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { Loader2 } from "lucide-react";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

export default function App() {
  const { user, loading, logout } = useAuth();

  // --- 1. INICIALIZAÇÃO DO GOOGLE AUTH (IMPORTANTE PARA ANDROID) ---
  useEffect(() => {
    GoogleAuth.initialize({
      clientId:
        "990994147026-grnttkd1j4bc10rpbaprb9rd05hoplou.apps.googleusercontent.com",
      scopes: ["profile", "email"],
      grantOfflineAccess: true,
    });
  }, []);

  // ❌ REMOVIDO: Lógica de PushNotifications (estava quebrando o build)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <>{!user ? <LoginPage /> : <HomePage user={user} onLogout={logout} />}</>
  );
}
