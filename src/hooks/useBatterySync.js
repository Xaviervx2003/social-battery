import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export function useBatterySync(user, batteryLevel) {
  const [saveStatus, setSaveStatus] = useState("idle");

  useEffect(() => {
    if (!user?.name) return;

    setSaveStatus("waiting");
    
    // Debounce de 5 segundos para economizar cota do Firebase
    const timeOutId = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await setDoc(doc(db, "users", user.name), { 
          batteryLevel,
          lastUpdate: new Date().toISOString()
        }, { merge: true });
        
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Erro ao salvar:", error);
        setSaveStatus("error");
      }
    }, 5000);

    return () => clearTimeout(timeOutId);
  }, [batteryLevel, user]);

  return { saveStatus };
}