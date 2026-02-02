// src/pages/LoginPage.jsx
import React from "react";
import { LoginForm } from "../components"; // Importação limpa (graças ao passo 1)

export default function LoginPage({ setUser }) {
  
  const handleLogin = (userName) => {
    // Cria o objeto do usuário
    const userData = { name: userName, loginTime: new Date() };
    
    // Passa para o App.js (que vai salvar no localStorage)
    setUser(userData);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* A página controla o layout, o componente controla o formulário */}
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}