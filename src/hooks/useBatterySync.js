import { useState, useEffect, useRef } from "react";
import { doc, collection, writeBatch } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getModeInfo } from "../utils/batteryHelpers";

export function useBatterySync(user, batteryLevel) {
  const [saveStatus, setSaveStatus] = useState("idle");
  const isFirstRender = useRef(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // SEGURANÇA: Se não tiver UID do Google, não faz nada.
    if (!user || !user.uid) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSaveStatus("waiting");

    timeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      
      try {
        const batch = writeBatch(db);
        const currentMode = getModeInfo(batteryLevel);

        // 1. Salva no Perfil (Usando UID do Google)
        const userRef = doc(db, "users", user.uid);
        batch.set(userRef, { 
          displayName: user.displayName || "Usuário",
          photoURL: user.photoURL || "",
          currentBattery: batteryLevel,
          lastUpdate: new Date().toISOString()
        }, { merge: true });

        // 2. Salva no Histórico (Usando UID do Google)
        const historyRef = doc(collection(db, "battery_logs"));
        batch.set(historyRef, {
          uid: user.uid, // <--- O segredo está aqui!
          level: batteryLevel,
          mode: currentMode.mode,
          timestamp: new Date()
        });

        await batch.commit();
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);

      } catch (error) {
        console.error("Erro ao salvar automático:", error);
        setSaveStatus("error");
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [batteryLevel, user]);

  return { saveStatus };
}