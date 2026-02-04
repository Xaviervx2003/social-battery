import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

// 1. Definimos a "Cara" do nosso Usuário (Contrato)
export interface UserData {
  uid: string;
  email: string | null;
  photoURL: string | null;
  displayName: string;
  searchName: string;
  userTag: string;
  currentBattery: number;
  status: string;
  isGhostMode: boolean;
  lastLogin: Date;
}

// 2. Definimos o que o Contexto exporta
interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado com proteção de tipo
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

// Tipagem das props do Provider (ele recebe 'children')
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
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
          const savedStatus = existingData.status || "";
          const savedGhostMode = existingData.isGhostMode || false;

          const userData: UserData = {
            uid: currentUser.uid,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            displayName: finalName,
            searchName: finalName.toLowerCase(), 
            userTag: finalTag,
            currentBattery: savedBattery,
            status: savedStatus,
            isGhostMode: savedGhostMode,
            lastLogin: new Date()
          };

          await setDoc(userRef, { ...userData }, { merge: true });

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

  const logout = async () => {
    await signOut(auth);
  };

  const value = { user, loading, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}