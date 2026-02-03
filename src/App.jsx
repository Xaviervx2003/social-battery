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
    // Escuta o login do Google em tempo real
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // 1. Tenta pegar dados extras do banco (se tiver)
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        let userData = {
          uid: currentUser.uid,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          // AQUI ESTÁ A CORREÇÃO:
          // Tenta pegar do banco, se não tiver, pega do Google, se não tiver, vira "Usuário"
          displayName: userSnap.exists() && userSnap.data().displayName 
            ? userSnap.data().displayName 
            : currentUser.displayName || "Usuário"
        };

        // 2. Se o usuário for novo (não tem no banco), cria o registro agora
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            email: userData.email,
            createdAt: new Date()
          });
        }

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
        <HomePage user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage />
      )}
    </div>
  );
}

export default App;