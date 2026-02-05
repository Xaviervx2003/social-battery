import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { UserData } from "../contexts/AuthContext";
import { Preferences } from "@capacitor/preferences"; // <--- IMPORTANTE

type SaveStatus = "idle" | "waiting" | "saving" | "saved" | "error";

export function useBatterySync(user: UserData | null, batteryLevel: number) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedLevel = useRef<number | null>(null);

  // Carrega o valor salvo localmente ao iniciar (para ficar rápido)
  useEffect(() => {
    const loadLocal = async () => {
      const { value } = await Preferences.get({ key: "widget_battery_level" });
      if (value && lastSavedLevel.current === null) {
        // Opcional: Você poderia usar isso para setar o estado inicial
        console.log("Bateria recuperada do disco:", value);
      }
    };
    loadLocal();
  }, []);

  useEffect(() => {
    if (!user?.uid || user.isGhostMode) return;

    // 1. SALVA LOCALMENTE PARA O WIDGET LER (INSTANTÂNEO)
    Preferences.set({
      key: "widget_battery_level",
      value: batteryLevel.toString(),
    });

    // Lógica de Debounce do Firebase (Mantida igual)
    if (
      saveStatus === "idle" ||
      saveStatus === "saved" ||
      saveStatus === "error"
    ) {
      setSaveStatus("waiting");
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      if (lastSavedLevel.current === batteryLevel) {
        setSaveStatus("saved");
        return;
      }

      setSaveStatus("saving");
      try {
        await updateDoc(doc(db, "users", user.uid), {
          batteryLevel: batteryLevel,
          lastUpdated: new Date(),
        });
        lastSavedLevel.current = batteryLevel;
        setSaveStatus("saved");

        // Volta para 'idle' depois de um tempo para sumir o ícone
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Erro ao salvar bateria:", error);
        setSaveStatus("error");
      }
    }, 2000); // 2 segundos de espera

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [batteryLevel, user, saveStatus]);

  return { saveStatus };
}
