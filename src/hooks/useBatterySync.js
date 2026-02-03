import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function useBatterySync(user, batteryLevel) {
  const [saveStatus, setSaveStatus] = useState("saved"); // saved, waiting, saving
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) return;

    // --- LÓGICA DO MODO FANTASMA ---
    // Se o usuário estiver no modo fantasma, NÃO salva a bateria.
    if (user.isGhostMode) {
        setSaveStatus("saved"); // Finge que salvou para não ficar rodando
        return; 
    }

    setSaveStatus("waiting");

    // Cancelar timer anterior (Debounce)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Esperar 2 segundos antes de salvar
    timeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        const userRef = doc(db, "users", user.uid);
        
        await updateDoc(userRef, {
          currentBattery: batteryLevel,
          lastUpdated: new Date()
        });
        
        setSaveStatus("saved");
      } catch (error) {
        console.error("Erro ao sincronizar bateria:", error);
        setSaveStatus("error");
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [batteryLevel, user]); // Recria se user mudar (ex: ativar ghost mode)

  return { saveStatus };
}