import React, { useState, useEffect } from "react";
import LoginPage from "./views/LoginPage"; // Certifique-se de ter criado este arquivo
import HomeView from "./views/HomeView"; // Certifique-se de ter este arquivo da refatoração anterior
// Importe os outros componentes necessários se você separou (FriendsView, etc) ou mantenha tudo junto se ainda não separou 100%

// Se você ainda não separou o HomeView em arquivo próprio,
// me avise que eu ajusto esse código. Mas assumindo que você seguiu a estrutura:

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Verifica se já tem usuário salvo no navegador ao abrir
  useEffect(() => {
    const savedUser = localStorage.getItem("socialBatteryUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // 2. Função de Logout (para testar depois)
  const handleLogout = () => {
    localStorage.removeItem("socialBatteryUser");
    setUser(null);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        Carregando...
      </div>
    );

  // 3. SE NÃO TIVER USUÁRIO -> MOSTRA LOGIN
  if (!user) {
    return <LoginPage setUser={setUser} />;
  }

  // 4. SE TIVER USUÁRIO -> MOSTRA O APP (Aqui vai o código da Bateria Social)
  // Nota: Estou passando o usuário e o logout para dentro, caso precise
  return (
    <div className="relative">
      {/* Botãozinho temporário de sair para você testar */}
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 z-50 bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
      >
        Sair
      </button>

      {/* Aqui chamamos o componente principal que fizemos antes */}
      {/* Se você chamou ele de 'SocialBatteryApp' ou apenas copiou o código para HomeView, ajuste aqui */}
      <MainApp user={user} />
    </div>
  );
}

// --- Componente Temporário Wrapper para o App Principal ---
// Cole aqui o código do 'SocialBatteryApp' (aquele grandão refatorado) se você não criou um arquivo separado para ele.
import SocialBatteryApp from "./views/SocialBatteryApp"; // Ajuste o caminho se necessário

function MainApp({ user }) {
  return <SocialBatteryApp />;
}
