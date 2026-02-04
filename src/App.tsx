import React from "react";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { Loader2 } from "lucide-react";

export default function App() {
  // O TypeScript vai reclamar do useAuth por enquanto (porque AuthContext ainda é JS),
  // mas vai funcionar como "any" (qualquer coisa).
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <LoginPage />
      ) : (
        // Passamos user e logout, o HomePage ainda é JS, então ele aceita sem reclamar
        <HomePage user={user} onLogout={logout} />
      )}
    </>
  );
}
