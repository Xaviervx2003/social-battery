import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

// Cria o contexto
const AuthContext = createContext();

// Hook personalizado para usar o contexto fácil
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // O "Olheiro" do Firebase
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Busca dados no Firestore
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          const existingData = userSnap.exists() ? userSnap.data() : {};

          // Lógica da Tag e Nome
          const finalName = existingData.displayName 
            ? existingData.displayName 
            : currentUser.displayName || "Usuário";

          let finalTag = existingData.userTag;
          if (!finalTag) {
              finalTag = Math.floor(1000 + Math.random() * 9000).toString();
          }

          // Recupera bateria salva ou usa 65
          const savedBattery = existingData.currentBattery ?? existingData.batteryLevel ?? 65;

          const userData = {
            uid: currentUser.uid,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            displayName: finalName,
            searchName: finalName.toLowerCase(), 
            userTag: finalTag,
            currentBattery: savedBattery,
            lastLogin: new Date()
          };

          // Salva/Atualiza no banco
          await setDoc(userRef, {
            uid: userData.uid,
            email: userData.email,
            photoURL: userData.photoURL,
            displayName: userData.displayName,
            searchName: userData.searchName,
            userTag: userData.userTag,
            lastLogin: userData.lastLogin
            // Não salvamos batteryLevel aqui para não sobrescrever com valor antigo
          }, { merge: true });

          setUser(userData);
        } catch (error) {
          console.error("Erro ao carregar usuário:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Função de Logout global
  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}