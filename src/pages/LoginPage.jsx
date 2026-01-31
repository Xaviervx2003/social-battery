import React from "react";
import LoginForm from "../components/LoginForm"; // Certifique-se que o LoginForm está na pasta components

export default function LoginPage({ setUser }) {
  const handleLogin = (email, password) => {
    // Simulação
    setUser({ name: "Rafa", email });
  };

  const handleRegister = (email, password, name) => {
    setUser({ name, email });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm
          onLogin={handleLogin}
          onRegister={handleRegister}
          isLoading={false}
          error={null}
        />
      </div>
    </div>
  );
}
