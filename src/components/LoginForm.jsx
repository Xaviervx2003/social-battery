import React, { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
import { LogIn, AlertCircle } from "lucide-react";

export default function LoginForm({ onSubmit }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Abre o popup do Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Manda os dados completos para a página de Login processar
      onSubmit({
        name: user.displayName,
        email: user.email,
        photo: user.photoURL, // <--- Aqui vem a foto do perfil!
        uid: user.uid
      });
      
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar com Google. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm animate-in zoom-in duration-500 text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 text-3xl">
          ⚡
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Social Battery</h1>
        <p className="text-slate-400 text-sm">Entre para compartilhar sua energia</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
      >
        {loading ? (
          "Conectando..."
        ) : (
          <>
            {/* Logo simples do Google via CSS */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 via-red-500 to-yellow-500 flex items-center justify-center text-[10px] text-white font-bold">G</div>
            Entrar com Google
          </>
        )}
      </button>
      
      <p className="text-xs text-slate-300 mt-6">
        Usamos apenas seu nome e foto para identificar você para seus amigos.
      </p>
    </div>
  );
}