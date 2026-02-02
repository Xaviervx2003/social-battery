import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FriendCard } from "../components"; // Importando do Barrel File!

export default function FriendsView() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca usuários ordenados por última atualização
    const q = query(collection(db, "users"), orderBy("lastUpdate", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const friendsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFriends(friendsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Carregando energias... ⚡</div>;

  return (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in duration-500">
      <header className="px-2 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Energia da Galera</h1>
        <p className="text-slate-500 text-sm">Quem precisa de uma recarga hoje?</p>
      </header>
      
      {friends.length === 0 ? (
        <div className="text-center py-10">
            <p className="text-5xl mb-4">🦗</p>
            <p className="text-slate-500">Ninguém aqui ainda...</p>
        </div>
      ) : (
        <div className="grid gap-3">
            {friends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} />
            ))}
        </div>
      )}
    </div>
  );
}
