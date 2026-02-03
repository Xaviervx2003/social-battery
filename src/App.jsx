import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esse "olheiro" fica vigiando se alguém logou
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Se logou, vamos buscar os dados no banco
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        // Dados existentes no banco (se houver)
        const existingData = userSnap.exists() ? userSnap.data() : {};

        // --- A MÁGICA DO NOME E TAG ---
        const finalName = existingData.displayName 
          ? existingData.displayName 
          : currentUser.displayName || "Usuário";

        let finalTag = existingData.userTag;
        if (!finalTag) {
            finalTag = Math.floor(1000 + Math.random() * 9000).toString();
        }

        // --- CORREÇÃO DO BUG DO F5 ---
        // Agora lemos a bateria salva. Se não tiver, assume 65.
        // Tenta ler 'currentBattery' (novo padrão) ou 'batteryLevel' (antigo)
        const savedBattery = existingData.currentBattery ?? existingData.batteryLevel ?? 65;

        const userData = {
          uid: currentUser.uid,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          displayName: finalName,
          searchName: finalName.toLowerCase(), 
          userTag: finalTag,
          currentBattery: savedBattery, // <--- SALVAMOS NO ESTADO LOCAL
          lastLogin: new Date()
        };

        // Salva/Atualiza no Firestore (merge: true não apaga o que já tem)
        await setDoc(userRef, {
          uid: userData.uid,
          email: userData.email,
          photoURL: userData.photoURL,
          displayName: userData.displayName,
          searchName: userData.searchName,
          userTag: userData.userTag,
          lastLogin: userData.lastLogin
          // NOTA: Não salvamos a bateria AQUI para não sobrescrever com 65 se a leitura falhar.
          // O hook useBatterySync na Home cuida de salvar a bateria.
        }, { merge: true });

        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {user ? (
        // PASSAMOS O VALOR LIDO DO BANCO PARA A HOME
        <HomePage 
            user={user} 
            initialLevel={user.currentBattery} 
            onLogout={handleLogout} 
        />
      ) : (
        <LoginPage />
      )}
    </div>
  );
}

export default App;