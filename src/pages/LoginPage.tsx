import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext"; // Usa nosso contexto inteligente
import { Battery, Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  // Puxamos as funções prontas do contexto
  const { loginGoogle, loginEmail, registerEmail } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      // O Contexto já sabe se é Android (Plugin Nativo) ou Web (Popup)
      await loginGoogle();
      // Não precisa redirecionar, o App.tsx detecta o login sozinho
    } catch (err: any) {
      console.error(err);
      setError("Erro ao conectar com Google. Verifique sua conexão.");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // LOGIN
        await loginEmail(email, password);
      } else {
        // CADASTRO
        if (!name) throw new Error("Nome é obrigatório.");
        await registerEmail(name, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential")
        setError("Email ou senha incorretos.");
      else if (err.code === "auth/email-already-in-use")
        setError("Este email já está em uso.");
      else if (err.code === "auth/weak-password")
        setError("A senha deve ter pelo menos 6 caracteres.");
      else setError(err.message || "Ocorreu um erro. Tente novamente.");

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
        {/* LOGO AREA */}
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3 hover:rotate-6 transition-transform">
            <Battery className="text-indigo-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Social Battery
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Sua energia social, compartilhada.
          </p>
        </div>

        {/* ERRO */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold mb-4 flex items-center gap-2 animate-pulse">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* FORMULÁRIO */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <User
                className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Seu Nome"
                required={!isLogin}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="relative group">
            <Mail
              className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
              size={20}
            />
            <input
              type="email"
              placeholder="seu@email.com"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-700 placeholder:text-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <Lock
              className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
              size={20}
            />
            <input
              type="password"
              placeholder="Sua senha secreta"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-700 placeholder:text-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {isLogin ? "Entrar" : "Criar Conta"} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-bold">
              Ou continue com
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5 h-5"
            alt="Google"
          />
          Google
        </button>

        <p className="text-center mt-8 text-sm text-slate-500 font-medium">
          {isLogin ? "Não tem conta ainda?" : "Já tem uma conta?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 hover:text-indigo-700 font-bold ml-1 hover:underline"
          >
            {isLogin ? "Cadastre-se" : "Faça Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
