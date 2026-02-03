import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { Zap, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      // O App.jsx já tem um "olheiro" (onAuthStateChanged) que vai perceber
      // assim que esse login der certo. Não precisamos fazer mais nada aqui!
      await signInWithPopup(auth, provider);
      
      // Não chamamos setUser() aqui, pois o App.jsx vai fazer isso automaticamente.
    } catch (err) {
      console.error("Erro no login:", err);
      setError("Não foi possível conectar. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      
      {/* Círculos decorativos no fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-200 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-30"></div>

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
             <Zap size={40} className="text-indigo-600 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Bateria Social</h1>
          <p className="text-slate-500 text-center text-sm mt-1">Monitore sua energia e conecte-se com amigos.</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
        >
          {loading ? (
             <Loader2 className="animate-spin text-indigo-600" />
          ) : (
            <>
                <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google Logo" 
                    className="w-5 h-5"
                />
                Entrar com Google
            </>
          )}
        </button>

        <p className="text-xs text-slate-400 text-center mt-6">
            Ao entrar, você concorda em compartilhar sua "bateria" com seus amigos adicionados.
        </p>
      </div>
    </div>
  );
}