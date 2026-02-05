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
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { Capacitor } from "@capacitor/core";

// 1. Definimos a "Cara" do nosso Usuário
export interface UserData {
  uid: string;
  email: string | null;
  photoURL: string | null;
  displayName: string;
  searchName: string; // Importante para a busca funcionar
  userTag: string;
  currentBattery: number;
  status: string;
  isGhostMode: boolean;
  lastLogin: Date;
  fcmToken?: string; // Para notificações push
}

// 2. Definimos o que o Contexto exporta (Funções novas adicionadas)
interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  // Métodos de Login
  loginGoogle: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  // Métodos de Dados
  toggleGhostMode: () => Promise<void>;
  updateBattery: (level: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuta o Auth do Firebase
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // --- MUDANÇA IMPORTANTE: onSnapshot em vez de getDoc ---
        // Isso garante que se você mudar a bateria em outro lugar, atualiza aqui na hora
        const userRef = doc(db, "users", currentUser.uid);

        const unsubFirestore = onSnapshot(
          userRef,
          async (docSnap) => {
            if (docSnap.exists()) {
              // Usuário já existe no banco, atualiza o estado local
              setUser({ uid: currentUser.uid, ...docSnap.data() } as UserData);
            } else {
              // Primeiro acesso (Novo Usuário): Cria o documento padrão
              const finalName = currentUser.displayName || "Usuário";
              const newTag = Math.floor(1000 + Math.random() * 9000).toString();

              const newUser: UserData = {
                uid: currentUser.uid,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                displayName: finalName,
                searchName: finalName.toLowerCase(),
                userTag: newTag,
                currentBattery: 65, // Começa com carga média
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
        // Lógica nativa (Android)
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(
          googleUser.authentication.idToken,
        );
        await signInWithCredential(auth, credential);
      } else {
        // Lógica web (Popup)
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
    // Cria conta no Auth
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    // Atualiza nome no perfil Auth
    await updateProfile(res.user, { displayName: name });
    // O onAuthStateChanged vai capturar e criar o doc no Firestore automaticamente
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
    // O onSnapshot vai atualizar o estado local automaticamente
    await setDoc(
      doc(db, "users", user.uid),
      { isGhostMode: newState },
      { merge: true },
    );
  };

  const updateBattery = async (level: number) => {
    if (!user || user.isGhostMode) return;
    await setDoc(
      doc(db, "users", user.uid),
      {
        currentBattery: level,
        lastLogin: new Date(),
      },
      { merge: true },
    );
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
