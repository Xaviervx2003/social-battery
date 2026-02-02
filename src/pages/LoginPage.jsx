import React from "react";
import { LoginForm } from "../components";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function LoginPage({ setUser }) {
  
  const handleLogin = async (googleUser) => {
    // 1. Cria o objeto do usuário
    const userData = { 
      name: googleUser.name, 
      photo: googleUser.photo,
      email: googleUser.email,
      loginTime: new Date().toISOString()
    };
    
    // 2. SALVA NO FIREBASE IMEDIATAMENTE (Para os amigos verem a foto)
    try {
      // Usamos 'merge: true' para não apagar o nível de bateria se já existir
      await setDoc(doc(db, "users", userData.name), userData, { merge: true });
    } catch (e) {
      console.error("Erro ao salvar perfil no banco:", e);
    }

    // 3. Atualiza o estado local do App para entrar na Home
    setUser(userData);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-200 to-slate-300">
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}