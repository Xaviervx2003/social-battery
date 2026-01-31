import React, { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Tenta recuperar o usuário salvo
    const saved = localStorage.getItem("socialBatteryUser");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleSetUser = (userData) => {
    setUser(userData);
    localStorage.setItem("socialBatteryUser", JSON.stringify(userData));
  };

  // Se não tem usuário, mostra Login. Se tem, mostra Home.
  return (
    <>
      {!user ? <LoginPage setUser={handleSetUser} /> : <HomePage user={user} />}
    </>
  );
}
