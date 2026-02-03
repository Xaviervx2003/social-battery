import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          const existingData = userSnap.exists() ? userSnap.data() : {};

          const finalName = existingData.displayName 
            ? existingData.displayName 
            : currentUser.displayName || "Usuário";

          let finalTag = existingData.userTag;
          if (!finalTag) {
              finalTag = Math.floor(1000 + Math.random() * 9000).toString();
          }

          const savedBattery = existingData.currentBattery ?? existingData.batteryLevel ?? 65;
          // NOVO: Carregar status salvo ou vazio
          const savedStatus = existingData.status || "";

          const userData = {
            uid: currentUser.uid,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            displayName: finalName,
            searchName: finalName.toLowerCase(), 
            userTag: finalTag,
            currentBattery: savedBattery,
            status: savedStatus, // <--- CAMPO NOVO
            lastLogin: new Date()
          };

          await setDoc(userRef, {
            ...userData
          }, { merge: true });

          setUser(userData);
        } catch (error) {
          console.error("Erro auth:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = () => signOut(auth);

  const value = { user, loading, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}