import React, { useState, useEffect } from "react";
import { 
  collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch 
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Zap, BellOff, Trash2, CheckCircle } from "lucide-react";

export default function NotificationsView({ currentUser }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // SEGURANÇA: Usa UID em vez de nome (evita bugs se tiver nomes iguais)
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "notifications"),
      where("to", "==", currentUser.uid), // <--- CORREÇÃO: Busca pelo ID Único
      orderBy("timestamp", "desc")        // <--- CORREÇÃO: Nome do campo padronizado
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

  // Marca como lida ao clicar
  const handleMarkAsRead = async (notifId, isRead) => {
    if (isRead) return;
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  // NOVIDADE: Limpa notificações antigas para não poluir a tela
  const clearRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => {
        if (n.read) {
            const ref = doc(db, "notifications", n.id);
            batch.delete(ref);
        }
    });
    await batch.commit();
  };

  return (
    <div className="p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 min-h-screen bg-slate-50">
      
      <div className="flex justify-between items-center mb-6 px-2">
          <h1 className="text-2xl font-bold text-slate-800">Notificações</h1>
          
          {/* Botão para limpar as lidas */}
          {notifications.some(n => n.read) && (
            <button 
                onClick={clearRead}
                className="text-xs text-slate-400 flex items-center gap-1 hover:text-red-500 transition-colors bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100"
            >
                <Trash2 size={14}/> Limpar lidas
            </button>
          )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <BellOff size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Tudo tranquilo por aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            // Tratamento de data seguro (evita erro se a data vier nula)
            const date = notif.timestamp?.toDate ? notif.timestamp.toDate() : new Date();
            
            return (
                <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id, notif.read)}
                className={`p-4 rounded-2xl flex items-center gap-4 transition-all cursor-pointer border relative overflow-hidden group
                    ${notif.read 
                        ? "bg-white border-slate-100 opacity-60 grayscale" // Lida: fica apagadinha
                        : "bg-white border-blue-100 shadow-md border-l-4 border-l-blue-500" // Nova: destaque azul
                    }
                `}
                >
                {/* Ícone Dinâmico */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 
                    ${notif.type === 'energy' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>
                    
                    {notif.fromPhoto ? (
                        <img src={notif.fromPhoto} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <Zap size={24} fill="currentColor" />
                    )}
                </div>

                <div className="flex-1">
                    <p className={`text-sm ${notif.read ? "text-slate-600" : "text-slate-800 font-bold"}`}>
                    {/* CORREÇÃO: Usa fromName para mostrar o nome real, não o código */}
                    <span className="capitalize text-indigo-600">{notif.fromName || "Alguém"}</span> {notif.message || "te enviou energia!"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex gap-2">
                        {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                        <span>•</span>
                        {date.toLocaleDateString()}
                    </p>
                </div>

                {/* Bolinha azul ou Check de lido */}
                {!notif.read ? (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                ) : (
                    <CheckCircle size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"/>
                )}
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
}