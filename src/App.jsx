import React, { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { db } from "./firebaseConfig"; // Importe o banco
import { doc, getDoc } from "firebase/firestore"; 

export default function App() {
  const [user, setUser] = useState(null);
  const [initialBattery, setInitialBattery] = useState(100);

  useEffect(() => {
    const saved = localStorage.getItem("socialBatteryUser");
    if (saved) {
      const parsedUser = JSON.parse(saved);
      setUser(parsedUser);
      fetchUserBattery(parsedUser.name); // Busca no Firebase ao abrir
    }
  }, []);

  const fetchUserBattery = async (userName) => {
    try {
      const docRef = doc(db, "users", userName);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setInitialBattery(docSnap.data().level);
      }
    } catch (e) {
      console.error("Erro ao buscar bateria:", e);
    }
  };

  const handleSetUser = (userData) => {
    setUser(userData);
    localStorage.setItem("socialBatteryUser", JSON.stringify(userData));
    fetchUserBattery(userData.name);
  };

  return (
    <>
      {!user ? (
        <LoginPage setUser={handleSetUser} />
      ) : (
        <HomePage user={user} initialLevel={initialBattery} />
      )}
    </>
  );
}