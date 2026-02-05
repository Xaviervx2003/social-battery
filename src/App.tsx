import React, { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth"; // <--- 1. IMPORTAR

export default function App() {
  const { user, loading, logout } = useAuth();

  // --- 2. INICIALIZAÇÃO DO GOOGLE AUTH (CRUCIAL PARA ANDROID) ---
  useEffect(() => {
    GoogleAuth.initialize({
      clientId:
        "990994147026-grnttkd1j4bc10rpbaprb9rd05hoplou.apps.googleusercontent.com",
      scopes: ["profile", "email"],
      grantOfflineAccess: true,
    });
  }, []);

  // --- LÓGICA DE NOTIFICAÇÕES (SÓ RODA NO CELULAR) ---
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return; // Não roda no navegador

    const registerPush = async () => {
      // 1. Pede permissão
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === "prompt") {
        perm = await PushNotifications.requestPermissions();
      }

      if (perm.receive !== "granted") {
        console.log("Permissão de notificação negada");
        return;
      }

      // 2. Registra o celular no serviço do Google (FCM)
      await PushNotifications.register();
    };

    registerPush();

    // 3. Ouve quando o registro dá certo e SALVA O TOKEN NO BANCO
    const addListeners = async () => {
      await PushNotifications.removeAllListeners();

      PushNotifications.addListener("registration", async (token) => {
        if (user?.uid) {
          try {
            // Salva o token dentro do documento do usuário
            await updateDoc(doc(db, "users", user.uid), {
              fcmToken: token.value,
            });
            console.log("Token de notificação salvo!", token.value);
          } catch (e) {
            console.error("Erro ao salvar token", e);
          }
        }
      });

      PushNotifications.addListener("registrationError", (err) => {
        console.error("Erro ao registrar push:", err.error);
      });

      // 4. Se a notificação chegar com o APP ABERTO
      PushNotifications.addListener(
        "pushNotificationReceived",
        async (notification) => {
          console.log("Notificação recebida na cara do gol:", notification);

          // VIBRA O CELULAR! 📳
          await Haptics.impact({ style: ImpactStyle.Heavy });
        },
      );

      // 5. Se clicar na notificação
      PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (notification) => {
          console.log("Clicou na notificação:", notification);
        },
      );
    };

    addListeners();
  }, [user]); // Roda sempre que o usuário logar

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
