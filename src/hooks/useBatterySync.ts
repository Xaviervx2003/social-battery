import { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { UserData } from "../contexts/AuthContext";
import { Preferences } from "@capacitor/preferences";

type SaveStatus = "idle" | "waiting" | "saving" | "saved" | "error";

export function useBatterySync(
  user: UserData | null,
  batteryLevel: number,
  setBatteryLevel?: (level: number) => void,
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  // 👇 A TRAVA DE SEGURANÇA QUE IMPEDE O RESET PARA 65
  const [isLoaded, setIsLoaded] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedLevel = useRef<number | null>(null);

  // 1. Carrega o valor salvo localmente ao iniciar
  useEffect(() => {
    const loadLocal = async () => {
      try {
        const { value } = await Preferences.get({
          key: "widget_battery_level",
        });

        if (value) {
          const savedLevel = parseInt(value);
          console.log("Bateria recuperada do disco:", savedLevel);

          if (setBatteryLevel && !isNaN(savedLevel)) {
            setBatteryLevel(savedLevel);
            lastSavedLevel.current = savedLevel;
          }
        }
      } catch (e) {
        console.error("Erro ao ler disco:", e);
      } finally {
        // 👇 SÓ AGORA LIBERA PARA SALVAR (Depois de ler)
        setIsLoaded(true);
      }
    };

    loadLocal();
  }, []);

  // 2. Salva alterações (Firebase + Local)
  useEffect(() => {
    // ⛔ SE AINDA NÃO LEU O DISCO, NÃO DEIXA SALVAR O 65!
    if (!isLoaded) return;

    if (lastSavedLevel.current === batteryLevel) return;

    // Salva Localmente
    Preferences.set({
      key: "widget_battery_level",
      value: batteryLevel.toString(),
    });

    if (!user?.uid || user.isGhostMode) return;

    // Salva no Firebase (com delay)
    setSaveStatus("waiting");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await updateDoc(doc(db, "users", user.uid), {
          batteryLevel: batteryLevel,
          lastUpdated: new Date(),
        });
        lastSavedLevel.current = batteryLevel;
        setSaveStatus("saved");

        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Erro ao salvar bateria:", error);
        setSaveStatus("error");
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [batteryLevel, user, isLoaded]); // <--- isLoaded é obrigatório aqui

  return { saveStatus };
}
