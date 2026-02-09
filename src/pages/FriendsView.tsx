import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  Search,
  UserPlus,
  Check,
  X,
  Users,
  Loader2,
  Hash,
  Bell,
  Zap,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { UserData } from "../contexts/AuthContext";
import { Preferences } from "@capacitor/preferences";

// Importações Refatoradas
import FriendItem, { Friend } from "../components/friends/FriendItem";
import { useFriendsList } from "../hooks/useFriendsList";

interface FriendRequest {
  requestId: string;
  from: string;
  to: string;
  status: string;
  displayName?: string;
  photoURL?: string;
}

interface FriendsViewProps {
  currentUser: UserData | null;
}

// Função auxiliar para calcular o novo Streak
const calculateNewStreak = (currentStreak: number, lastDate: any) => {
  // Se nunca interagiu, começa o streak agora (1)
  if (!lastDate) return 1;

  const now = new Date();
  // Converte Timestamp do Firebase para Date JS, se necessário
  const last = lastDate.toDate ? lastDate.toDate() : new Date(lastDate);

  // Zera as horas para comparar apenas os dias (Meia-noite)
  now.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);

  // Diferença em milissegundos
  const diffTime = Math.abs(now.getTime() - last.getTime());
  // Converte para dias (1 dia = 1000ms * 60s * 60m * 24h)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return currentStreak; // Já interagiu hoje, mantém
  if (diffDays === 1) return currentStreak + 1; // Interagiu ontem, aumenta 🔥
  return 1; // Passou mais de 1 dia, quebrou o streak (Recomeça em 1) 😢
};

export default function FriendsView({ currentUser }: FriendsViewProps) {
  const [view, setView] = useState<"list" | "search" | "requests">("list");
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Modais e Ações
  const [modalState, setModalState] = useState<{
    type: "message" | "remove" | null;
    data: Friend | any | null;
  }>({ type: null, data: null });
  const [messageText, setMessageText] = useState("");
  const [actionStatus, setActionStatus] = useState<
    "idle" | "loading" | "success"
  >("idle");

  // Hook Refatorado
  const { friends, loading } = useFriendsList(currentUser);

  const quickMessages = [
    "Bora sair? 🍻",
    "Força aí! 💪",
    "Saudades! ❤️",
    "Acorda!! ⏰",
    "Qual a boa? 👀",
  ];

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    },
    [],
  );

  // Sync Widget
  useEffect(() => {
    const updateWidgetData = async () => {
      const topFriends = friends.slice(0, 2);
      if (topFriends[0]) {
        await Preferences.set({
          key: "widget_friend1_name",
          value: topFriends[0].displayName?.split(" ")[0] || "Amigo",
        });
        await Preferences.set({
          key: "widget_friend1_level",
          value: topFriends[0].finalBattery.toString(),
        });
      }
      if (topFriends[1]) {
        await Preferences.set({
          key: "widget_friend2_name",
          value: topFriends[1].displayName?.split(" ")[0] || "Amigo",
        });
        await Preferences.set({
          key: "widget_friend2_level",
          value: topFriends[1].finalBattery.toString(),
        });
      }
    };
    updateWidgetData();
  }, [friends]);

  // Carregar Requests
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, "friend_requests"),
      where("to", "==", currentUser.uid),
      where("status", "==", "pending"),
    );
    const unsub = onSnapshot(q, async (snap) => {
      const reqs: FriendRequest[] = [];
      for (const d of snap.docs) {
        const fromId = d.data().from;
        const uSnap = await getDocs(
          query(collection(db, "users"), where("uid", "==", fromId)),
        );
        if (!uSnap.empty) {
          reqs.push({
            requestId: d.id,
            from: fromId,
            to: currentUser.uid,
            status: "pending",
            ...uSnap.docs[0].data(),
          } as FriendRequest);
        }
      }
      setRequests(reqs);
    });
    return () => unsub();
  }, [currentUser]);

  // Ações
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm || !currentUser) return;
    try {
      const q = query(collection(db, "users"), limit(20));
      const snap = await getDocs(q);
      const term = searchTerm.toLowerCase().trim().replace("#", "");
      const res = snap.docs
        .map((d) => d.data() as UserData)
        .filter((u) => {
          if (u.uid === currentUser.uid || friends.some((f) => f.uid === u.uid))
            return false;
          return (
            u.displayName?.toLowerCase().includes(term) ||
            u.userTag == term ||
            u.email?.toLowerCase().includes(term)
          );
        });
      setSearchResults(res);
    } catch {
      showToast("Erro ao buscar.", "error");
    }
  };

  const sendFriendRequest = async (targetUser: UserData) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, "friend_requests"), {
        from: currentUser.uid,
        to: targetUser.uid,
        status: "pending",
        timestamp: new Date(),
      });
      showToast("Convite enviado!", "success");
      setSearchResults((prev) => prev.filter((p) => p.uid !== targetUser.uid));
    } catch {
      showToast("Erro ao enviar.", "error");
    }
  };

  const acceptRequest = async (req: FriendRequest) => {
    try {
      await updateDoc(doc(db, "friend_requests", req.requestId), {
        status: "accepted",
        streak: 0,
        lastInteraction: new Date(),
      });
      showToast("Agora vocês são amigos!", "success");
      setView("list");
    } catch {
      showToast("Erro ao aceitar.", "error");
    }
  };

  const handleSendMessage = async () => {
    // Verifica se tem dados do amigo e do usuário logado
    if (!modalState.data || !currentUser) return;
    if (messageText.length > 140) {
      // Limite tipo Twitter antigo
      showToast("Texto muito grande! Máximo 140 caracteres.", "error");
      return; // Para tudo aqui
    }
    setActionStatus("loading");

    try {
      // 1. Envia a Notificação (Como já fazia antes)
      const finalMessage =
        messageText.trim() || "te mandou um raio de energia! ⚡";

      await addDoc(collection(db, "notifications"), {
        from: currentUser.uid,
        fromName: currentUser.displayName,
        to: modalState.data.uid,
        type: "energy",
        message: finalMessage,
        read: false,
        timestamp: new Date(),
      });

      // 2. Atualiza o Streak e Última Interação no documento da Amizade
      if (modalState.data.requestId) {
        // Calcula o novo valor do foguinho
        const newStreak = calculateNewStreak(
          modalState.data.streak || 0,
          modalState.data.lastInteraction,
        );

        await updateDoc(doc(db, "friend_requests", modalState.data.requestId), {
          lastInteraction: new Date(), // Atualiza a data para "Agora"
          streak: newStreak, // Salva o novo foguinho
        });
      }

      setActionStatus("success");
      setTimeout(() => {
        setModalState({ type: null, data: null });
      }, 1500);
    } catch (err) {
      console.error("Erro ao enviar:", err);
      setActionStatus("idle");
    }
  };

  const handleRemoveFriend = async () => {
    if (!modalState.data) return;
    try {
      await deleteDoc(doc(db, "friend_requests", modalState.data.requestId));
      showToast("Amigo removido.", "success");
      setModalState({ type: null, data: null });
    } catch {
      showToast("Erro ao remover.", "error");
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24 min-h-screen bg-slate-50 relative">
      {notification && (
        <div
          // 👇 AQUI ESTÁ A CORREÇÃO: max-w, text-center e break-words
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-xl font-bold text-sm flex items-center gap-2 max-w-[90vw] text-center break-words ${notification.type === "error" ? "bg-red-500 text-white" : "bg-slate-800 text-white"}`}
        >
          {notification.type === "success" ? (
            <Check size={16} className="shrink-0" /> // shrink-0 impede o ícone de esmagar
          ) : (
            <AlertTriangle size={16} className="shrink-0" />
          )}{" "}
          {notification.message}
        </div>
      )}

      <div className="flex bg-white p-1 rounded-2xl shadow-sm mb-4 sticky top-0 z-30">
        <button
          onClick={() => setView("list")}
          className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 ${view === "list" ? "bg-indigo-100 text-indigo-700" : "text-slate-400"}`}
        >
          <Users size={18} /> Galera
        </button>
        <button
          onClick={() => setView("search")}
          className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 ${view === "search" ? "bg-indigo-100 text-indigo-700" : "text-slate-400"}`}
        >
          <Search size={18} /> Explorar
        </button>
        <button
          onClick={() => setView("requests")}
          className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 relative ${view === "requests" ? "bg-indigo-100 text-indigo-700" : "text-slate-400"}`}
        >
          <UserPlus size={18} />{" "}
          {requests.length > 0 && (
            <span className="absolute top-1 right-3 bg-red-500 w-2.5 h-2.5 rounded-full animate-ping"></span>
          )}
        </button>
      </div>

      {view === "list" && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-indigo-500" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-10 opacity-60">
              <p className="text-5xl mb-4">🤷‍♂️</p>
              <p>Lista vazia.</p>
            </div>
          ) : (
            friends.map((friend) => (
              <FriendItem
                key={friend.uid}
                friend={friend}
                onRemove={() => setModalState({ type: "remove", data: friend })}
                onMessage={() => {
                  setModalState({ type: "message", data: friend });
                  setMessageText("");
                }}
              />
            ))
          )}
        </div>
      )}

      {view === "search" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-3">
              Encontrar Pessoas
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Nome, Tag ou Email..."
                className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white p-3 rounded-xl"
              >
                <Search />
              </button>
            </form>
          </div>
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.uid}
                className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center"
              >
                <div>
                  <span className="font-bold block">{user.displayName}</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Hash size={10} /> {user.userTag || "----"}
                  </span>
                </div>
                <button
                  onClick={() => sendFriendRequest(user)}
                  className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold"
                >
                  Convidar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "requests" && (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.requestId}
              className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 flex justify-between items-center"
            >
              <div>
                <p className="font-bold">{req.displayName}</p>
                <span className="text-xs text-slate-400">
                  quer ser seu amigo
                </span>
              </div>
              <button
                onClick={() => acceptRequest(req)}
                className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex justify-center items-center"
              >
                <Check size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAIS (MANTIDOS IGUAIS) */}
      {modalState.type === "message" && modalState.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Zap className="text-yellow-500" size={20} /> Mandar Energia
              </h3>
              <button
                onClick={() => setModalState({ type: null, data: null })}
                className="p-2 bg-slate-100 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            {actionStatus === "success" ? (
              <div className="py-10 text-center">
                <Check size={32} className="mx-auto text-green-500" />
                <p className="font-bold text-green-600">Enviado!</p>
              </div>
            ) : (
              <>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 resize-none h-32"
                  placeholder="Sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 mb-6">
                  {quickMessages.map((msg) => (
                    <button
                      key={msg}
                      onClick={() => setMessageText(msg)}
                      className="text-xs font-bold bg-slate-100 border px-3 py-2 rounded-lg"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={actionStatus === "loading"}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2"
                >
                  {actionStatus === "loading" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      Enviar <Zap size={18} />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {modalState.type === "remove" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 text-center">
            <h3 className="font-bold text-lg mb-4">Remover amigo?</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setModalState({ type: null, data: null })}
                className="flex-1 py-3 font-bold bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemoveFriend}
                className="flex-1 py-3 font-bold text-white bg-red-500 rounded-xl"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
