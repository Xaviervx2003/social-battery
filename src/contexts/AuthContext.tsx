import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebaseConfig";
// 👇 Importante: Adicionei addDoc e collection
import {
  doc,
  setDoc,
  onSnapshot,
  addDoc,
  collection,
} from "firebase/firestore";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { Capacitor } from "@capacitor/core";

// 1. Definimos a "Cara" do nosso Usuário
export interface UserData {
  uid: string;
  email: string | null;
  photoURL: string | null;
  displayName: string;
  searchName: string;
  userTag: string;
  batteryLevel: number;
  currentBattery?: number;
  status: string;
  isGhostMode: boolean;
  lastLogin: Date;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  loginGoogle: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleGhostMode: () => Promise<void>;
  updateBattery: (level: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);

        const unsubFirestore = onSnapshot(
          userRef,
          async (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const actualLevel =
                data.batteryLevel ?? data.currentBattery ?? 65;

              const safeUser: UserData = {
                uid: currentUser.uid,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                displayName: data.displayName || "Usuário",
                searchName: data.searchName || "",
                userTag: data.userTag || "0000",
                status: data.status || "",
                isGhostMode: data.isGhostMode || false,
                lastLogin: data.lastLogin?.toDate
                  ? data.lastLogin.toDate()
                  : new Date(),
                batteryLevel: actualLevel,
                currentBattery: data.currentBattery,
              };

              setUser(safeUser);
            } else {
              // Criação de Novo Usuário
              const finalName = currentUser.displayName || "Usuário";
              const newTag = Math.floor(1000 + Math.random() * 9000).toString();

              const newUser: UserData = {
                uid: currentUser.uid,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                displayName: finalName,
                searchName: finalName.toLowerCase(),
                userTag: newTag,
                batteryLevel: 65,
                status: "",
                isGhostMode: false,
                lastLogin: new Date(),
              };

              await setDoc(userRef, newUser);
              setUser(newUser);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Erro no realtime user:", error);
            setLoading(false);
          },
        );

        return () => unsubFirestore();
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- AÇÕES ---
  const loginGoogle = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(
          googleUser.authentication.idToken,
        );
        await signInWithCredential(auth, credential);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      console.error("Erro Login Google:", error);
      throw error;
    }
  };

  const loginEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerEmail = async (name: string, email: string, pass: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
  };

  const logout = async () => {
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
    await signOut(auth);
    setUser(null);
  };

  const toggleGhostMode = async () => {
    if (!user) return;
    const newState = !user.isGhostMode;
    await setDoc(
      doc(db, "users", user.uid),
      { isGhostMode: newState },
      { merge: true },
    );
  };

  // 👇 AQUI ESTAVA O PROBLEMA: Agora salva no histórico também!
  const updateBattery = async (level: number) => {
    if (!user || user.isGhostMode) return;

    // 1. Atualiza o perfil (Para os amigos verem agora)
    await setDoc(
      doc(db, "users", user.uid),
      {
        batteryLevel: level,
        lastLogin: new Date(),
      },
      { merge: true },
    );

    // 2. Cria um registro no histórico (Para o gráfico funcionar)
    try {
      await addDoc(collection(db, "battery_logs"), {
        uid: user.uid,
        level: level,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Erro ao salvar histórico:", error);
    }
  };

  const value = {
    user,
    loading,
    loginGoogle,
    loginEmail,
    registerEmail,
    logout,
    toggleGhostMode,
    updateBattery,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
