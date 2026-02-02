import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Zap, BellOff } from "lucide-react";

export default function NotificationsView({ currentUser }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser?.name) return;

    // Busca notificações onde "to" (para) é igual ao meu nome
    const q = query(
      collection(db, "notifications"),
      where("to", "==", currentUser.name),
      orderBy("createdAt", "desc") // As mais novas primeiro
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(list);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Função para marcar como lida ao clicar
  const handleMarkAsRead = async (notifId, isRead) => {
    if (isRead) return;
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 pb-24 animate-in fade-in slide-in-from-bottom-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 px-2">Suas Notificações</h1>

      {notifications.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <BellOff size={48} className="mx-auto mb-4 opacity-50" />
          <p>Tudo tranquilo por aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkAsRead(notif.id, notif.read)}
              className={`p-4 rounded-2xl flex items-center gap-4 transition-all cursor-pointer border ${
                notif.read ? "bg-white border-slate-100" : "bg-blue-50 border-blue-100 shadow-sm"
              }`}
            >
              {/* Ícone ou Foto de quem mandou */}
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0">
                {notif.fromPhoto ? (
                    <img src={notif.fromPhoto} className="w-full h-full rounded-full object-cover" />
                ) : (
                    <Zap size={20} fill="currentColor" />
                )}
              </div>

              <div className="flex-1">
                <p className={`text-sm ${notif.read ? "text-slate-600" : "text-slate-800 font-bold"}`}>
                  <span className="capitalize">{notif.from}</span> te enviou uma recarga de energia! ⚡
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(notif.createdAt).toLocaleDateString()}
                </p>
              </div>

              {!notif.read && (
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}