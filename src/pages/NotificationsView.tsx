import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  Bell,
  Trash2,
  CheckCircle,
  Zap,
  X,
  MessageSquare,
  Loader2,
  Check,
  CornerUpLeft,
  AlertTriangle,
} from "lucide-react";
import { UserData } from "../contexts/AuthContext";

// --- INTERFACES ---

interface NotificationsViewProps {
  currentUser: UserData | null;
}

interface NotificationItem {
  id: string;
  from: string;
  fromName?: string;
  to: string;
  type: string; // 'energy', etc.
  message: string;
  read: boolean;
  timestamp?: Timestamp; // Tipo específico do Firebase
}

interface ReplyTarget {
  uid: string;
  name: string;
}

type SendingState = "idle" | "sending" | "sent";

export default function NotificationsView({
  currentUser,
}: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA O MODAL DE RESPOSTA ---
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingState, setSendingState] = useState<SendingState>("idle");

  // --- ESTADO PARA O MODAL DE LIMPEZA ---
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const quickReplies = [
    "Recebido! ⚡",
    "Tmj! 👊",
    "Devolvendo a energia! 🔋",
    "Opa! 👀",
    "Valeu! ❤️",
  ];

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "notifications"),
      where("to", "==", currentUser.uid),
      orderBy("timestamp", "desc"),
      limit(20),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationItem[]; // Forçamos a tipagem aqui

      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // --- AÇÃO AO CLICAR NA NOTIFICAÇÃO ---
  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        const ref = doc(db, "notifications", notif.id);
        await updateDoc(ref, { read: true });
      } catch (error) {
        console.error("Erro ao ler:", error);
      }
    }

    if (notif.type === "energy" && notif.from) {
      setReplyTarget({ uid: notif.from, name: notif.fromName || "Amigo" });
      setMessageText("");
      setSendingState("idle");
      setIsReplyModalOpen(true);
    }
  };

  // --- ENVIAR RESPOSTA ---
  const handleSendReply = async () => {
    if (!replyTarget || !currentUser) return;

    // 👇 TRAVA DE SEGURANÇA: Impede envio de textos gigantes
    if (messageText.length > 140) {
      alert("Texto muito grande! Máximo 140 caracteres.");
      return;
    }

    setSendingState("sending");

    try {
      const finalMessage = messageText.trim() || "retribuiu sua energia! ⚡";
      await addDoc(collection(db, "notifications"), {
        from: currentUser.uid,
        fromName: currentUser.displayName,
        to: replyTarget.uid,
        type: "energy",
        message: finalMessage,
        read: false,
        timestamp: new Date(),
      });
      setSendingState("sent");
      setTimeout(() => {
        setIsReplyModalOpen(false);
        setSendingState("idle");
      }, 1500);
    } catch (err) {
      console.error(err);
      setSendingState("idle");
    }
  };

  // --- LIMPAR TUDO (Lógica real) ---
  const performClearAll = async () => {
    setIsClearing(true);
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        const ref = doc(db, "notifications", notif.id);
        batch.delete(ref);
      });
      await batch.commit();
      setIsClearModalOpen(false);
    } catch (error) {
      console.error("Erro ao limpar:", error);
    } finally {
      setIsClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
        <p className="text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center px-2 mb-2">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Bell className="fill-indigo-100 text-indigo-600" />
          Notificações
        </h2>
        {notifications.length > 0 && (
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={12} /> Limpar
          </button>
        )}
      </div>

      {/* LISTA VAZIA */}
      {notifications.length === 0 && (
        <div className="text-center py-12 opacity-50 bg-white rounded-3xl border border-slate-100 shadow-sm mx-2">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">Tudo limpo!</p>
        </div>
      )}

      {/* LISTA DE NOTIFICAÇÕES */}
      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => handleNotificationClick(notif)}
            className={`
              relative p-4 rounded-2xl shadow-sm border transition-all cursor-pointer active:scale-95
              ${
                notif.read
                  ? "bg-white border-slate-100 opacity-70"
                  : "bg-white border-indigo-100 shadow-indigo-100 ring-1 ring-indigo-50"
              }
            `}
          >
            {!notif.read && (
              <span className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-sm shadow-indigo-300"></span>
            )}

            <div className="flex items-start gap-3">
              <div
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notif.type === "energy" ? "bg-yellow-100 text-yellow-600" : "bg-slate-100 text-slate-500"}`}
              >
                {notif.type === "energy" ? (
                  <Zap size={20} className="fill-current" />
                ) : (
                  <Bell size={20} />
                )}
              </div>

              <div className="flex-1 overflow-hidden">
                {" "}
                {/* Adicionado overflow-hidden */}
                <p className="font-bold text-slate-800 text-sm mb-0.5 truncate">
                  {notif.fromName || "Alguém"}
                </p>
                {/* 👇 AQUI ESTÁ A CORREÇÃO VISUAL PARA TEXTOS GRANDES */}
                <p className="text-sm text-slate-600 leading-snug break-words whitespace-pre-wrap">
                  {notif.message}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-slate-400 font-medium">
                    {notif.timestamp?.toDate
                      ? notif.timestamp.toDate().toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Agora"}
                  </p>
                  {notif.type === "energy" && (
                    <span className="text-[10px] text-indigo-500 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
                      <CornerUpLeft size={10} /> Responder
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL 1: CONFIRMAÇÃO DE LIMPEZA --- */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">
              Limpar tudo?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Você vai apagar todas as notificações recebidas. Essa ação não
              pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={performClearAll}
                disabled={isClearing}
                className="flex-1 py-3 font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Apagar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: RESPOSTA --- */}
      {isReplyModalOpen && replyTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                Responder{" "}
                <span className="text-indigo-600">
                  {replyTarget.name.split(" ")[0]}
                </span>
              </h3>
              <button
                onClick={() => setIsReplyModalOpen(false)}
                className="bg-slate-100 p-2 rounded-full text-slate-400 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {sendingState === "sent" ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Check size={32} />
                </div>
                <p className="font-bold text-green-600">Enviado de volta!</p>
              </div>
            ) : (
              <>
                <div className="relative mb-4">
                  {/* Adicionado break-words aqui também para garantir */}
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-indigo-500 min-h-[100px] resize-none break-words"
                    placeholder="Escreva sua resposta..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <MessageSquare
                    size={16}
                    className="absolute bottom-4 right-4 text-slate-300"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {quickReplies.map((msg) => (
                    <button
                      key={msg}
                      onClick={() => setMessageText(msg)}
                      className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 hover:text-indigo-600 transition-colors border border-slate-200"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSendReply}
                  disabled={sendingState === "sending"}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {sendingState === "sending" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Zap className="fill-current" /> Enviar
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
