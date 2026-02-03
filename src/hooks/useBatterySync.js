import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function useBatterySync(user, batteryLevel) {
  const [saveStatus, setSaveStatus] = useState("saved"); // saved, waiting, saving, error
  const timeoutRef = useRef(null);
  
  // Guardamos o último valor salvo para não salvar se for igual (economia extra)
  const lastSavedValue = useRef(user?.currentBattery ?? null);

  useEffect(() => {
    // Validações básicas
    if (!user?.uid) return;

    // --- LÓGICA DO MODO FANTASMA ---
    // Se o usuário estiver no modo fantasma, NÃO salva a bateria.
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

    // Limpa o timer anterior (lógica de Debounce)
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
          lastUpdated: new Date()
        });
        
        // Sucesso: atualiza a referência e o status
        lastSavedValue.current = batteryLevel;
        setSaveStatus("saved");
        
      } catch (error) {
        console.error("Erro ao sincronizar bateria:", error);
        setSaveStatus("error");
        
        // Opcional: Tentar novamente em 5s se falhar? 
        // Por enquanto, deixamos como erro para o usuário ver.
      }
    }, 2000); // 2 segundos de espera

    // Cleanup: Se o componente desmontar ou user mudar, cancela o timer pendente
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [batteryLevel, user]); // Dependências: Roda quando a bateria muda ou o user (ghost mode) muda

  return { saveStatus };
}