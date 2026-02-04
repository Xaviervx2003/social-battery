import { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { UserData } from "../contexts/AuthContext";

// 1. Definimos os status permitidos (Union Type)
type SaveStatus = "saved" | "waiting" | "saving" | "error";

export function useBatterySync(user: UserData | null, batteryLevel: number) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  // 2. Tipagem correta para o setTimeout no React/TS
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 3. Tipagem para o valor salvo (número ou null)
  const lastSavedValue = useRef<number | null>(user?.currentBattery ?? null);

  useEffect(() => {
    // Validações básicas
    if (!user?.uid) return;

    // --- LÓGICA DO MODO FANTASMA ---
    if (user.isGhostMode) {
      setSaveStatus("saved");
      return;
    }

    // Se o valor atual for igual ao último salvo, não faz nada
    if (batteryLevel === lastSavedValue.current) {
      setSaveStatus("saved");
      return;
    }

    // Mudou? Então está "pendente"
    setSaveStatus("waiting");

    // Limpa o timer anterior (Debounce)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cria o novo timer
    timeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");

        const userRef = doc(db, "users", user.uid);

        await updateDoc(userRef, {
          currentBattery: batteryLevel,
          lastUpdated: new Date(),
        });

        // Sucesso
        lastSavedValue.current = batteryLevel;
        setSaveStatus("saved");
      } catch (error) {
        console.error("Erro ao sincronizar bateria:", error);
        setSaveStatus("error");
      }
    }, 2000); // 2 segundos

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [batteryLevel, user]);

  return { saveStatus };
}
