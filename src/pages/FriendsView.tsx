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
  documentId,
  DocumentData,
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
  Battery,
  Trash2,
  Clock,
  Zap,
  AlertCircle,
  Flame,
} from "lucide-react";
import { UserData } from "../contexts/AuthContext";
import { Preferences } from "@capacitor/preferences"; // Importante para o Widget

// --- INTERFACES ---

interface Friend extends UserData {
  requestId: string;
  streak: number;
  finalBattery: number;
  lastInteraction?: any;
}

interface FriendRequest {
  requestId: string;
  from: string;
  to: string;
  status: string;
  displayName?: string;
  photoURL?: string;
  timestamp?: any;
}

interface FriendsViewProps {
  currentUser: UserData | null;
}

interface NotificationState {
  message: string;
  type: "success" | "error";
}

interface ModalState {
  type: "message" | "remove" | null;
  data: Friend | any | null;
}

// --- CUSTOM HOOK: useFriendsList ---
function useFriendsList(currentUser: UserData | null) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);

    // Queries para buscar amizades aceitas (enviadas e recebidas)
    const q1 = query(
      collection(db, "friend_requests"),
      where("to", "==", currentUser.uid),
      where("status", "==", "accepted"),
    );
    const q2 = query(
      collection(db, "friend_requests"),
      where("from", "==", currentUser.uid),
      where("status", "==", "accepted"),
    );

    const unsub1 = onSnapshot(q1, (snap1) => updateFriendsList(snap1, "to"));
    const unsub2 = onSnapshot(q2, (snap2) => updateFriendsList(snap2, "from"));

    let connectionsTo: DocumentData[] = [];
    let connectionsFrom: DocumentData[] = [];

    const updateFriendsList = async (snapshot: any, type: "to" | "from") => {
      if (type === "to") connectionsTo = snapshot.docs;
      else connectionsFrom = snapshot.docs;

      const combinedDocs = [...connectionsTo, ...connectionsFrom];
      const friendMap = new Map();
      const friendUids: string[] = [];

      combinedDocs.forEach((d) => {
        const data = d.data();
        const friendUid = data.from === currentUser.uid ? data.to : data.from;
        friendUids.push(friendUid);
        friendMap.set(friendUid, { requestId: d.id, ...data });
      });

      if (friendUids.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Busca dados dos usuários em tempo real
      // (Limitado a 10 IDs por query devido a restrições do Firestore 'in')
      const usersRef = collection(db, "users");
      const qUsers = query(
        usersRef,
        where(documentId(), "in", friendUids.slice(0, 10)),
      );

      const unsubUsers = onSnapshot(qUsers, (userSnap) => {
        const friendsData: Friend[] = [];
        userSnap.forEach((docUser) => {
          const uData = docUser.data() as UserData;
          const requestData = friendMap.get(docUser.id);

          friendsData.push({
            ...uData,
            uid: docUser.id,
            requestId: requestData.requestId,
            streak: requestData.streak || 0,
            finalBattery: uData.currentBattery ?? 0,
            lastInteraction: requestData.lastInteraction,
          });
        });

        // --- SMART SORT ALGORITHM ---
        // Prioriza: Baixa Bateria (Urgência) + Streak Alto (Intimidade)
        friendsData.sort((a, b) => {
          const urgencyA = 100 - a.finalBattery;
          const intimacyA = (a.streak || 0) * 5;
          const scoreA = urgencyA + intimacyA;

          const urgencyB = 100 - b.finalBattery;
          const intimacyB = (b.streak || 0) * 5;
          const scoreB = urgencyB + intimacyB;

          return scoreB - scoreA;
        });

        setFriends(friendsData);
        setLoading(false);
      });

      return () => unsubUsers();
    };

    return () => {
      unsub1();
      unsub2();
    };
  }, [currentUser]);

  return { friends, loading };
}

// --- COMPONENTE PRINCIPAL ---
export default function FriendsView({ currentUser }: FriendsViewProps) {
  const [view, setView] = useState<"list" | "search" | "requests">("list");
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { friends, loading } = useFriendsList(currentUser);

  const [notification, setNotification] = useState<NotificationState | null>(
    null,
  );
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: null,
  });
  const [messageText, setMessageText] = useState("");
  const [actionStatus, setActionStatus] = useState<
    "idle" | "loading" | "success"
  >("idle");

  const quickMessages = [
    "Bora sair? 🍻",
    "Força aí! 💪",
    "Saudades! ❤️",
    "Acorda!! ⏰",
    "Qual a boa? 👀",
  ];

  // --- SINCRONIZAÇÃO COM O WIDGET ---
  useEffect(() => {
    const updateWidgetData = async () => {
      const topFriends = friends.slice(0, 2);

      // Amigo 1
      if (topFriends.length > 0) {
        const f1Name = topFriends[0].displayName?.split(" ")[0] || "Amigo";
        await Preferences.set({ key: "widget_friend1_name", value: f1Name });
        await Preferences.set({
          key: "widget_friend1_level",
          value: topFriends[0].finalBattery.toString(),
        });
      } else {
        await Preferences.remove({ key: "widget_friend1_name" });
        await Preferences.remove({ key: "widget_friend1_level" });
      }

      // Amigo 2
      if (topFriends.length > 1) {
        const f2Name = topFriends[1].displayName?.split(" ")[0] || "Amigo";
        await Preferences.set({ key: "widget_friend2_name", value: f2Name });
        await Preferences.set({
          key: "widget_friend2_level",
          value: topFriends[1].finalBattery.toString(),
        });
      } else {
        await Preferences.remove({ key: "widget_friend2_name" });
        await Preferences.remove({ key: "widget_friend2_level" });
      }
    };

    updateWidgetData();
  }, [friends]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    },
    [],
  );

  const formatLastSeen = (timestamp: any) => {
    if (!timestamp) return "Há muito tempo";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = (new Date().getTime() - date.getTime()) / 1000;

    if (diff < 60) return "Agora mesmo";
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
    return `Há ${Math.floor(diff / 86400)} dias`;
  };

  // Carregamento de Requests (Convites Pendentes)
  useEffect(() => {
    if (!currentUser?.uid) return;
    const qRequests = query(
      collection(db, "friend_requests"),
      where("to", "==", currentUser.uid),
      where("status", "==", "pending"),
    );
    const unsub = onSnapshot(qRequests, async (snapshot) => {
      const reqs: FriendRequest[] = [];
      for (const d of snapshot.docs) {
        const fromId = d.data().from;
        const userSnap = await getDocs(
          query(collection(db, "users"), where("uid", "==", fromId)),
        );
        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data();
          reqs.push({
            requestId: d.id,
            from: fromId,
            to: currentUser.uid,
            status: "pending",
            displayName: userData.displayName,
            photoURL: userData.photoURL,
          });
        } else {
          reqs.push({
            requestId: d.id,
            from: fromId,
            to: currentUser.uid,
            status: "pending",
            displayName: "Desconhecido",
          });
        }
      }
      setRequests(reqs);
    });
    return () => unsub();
  }, [currentUser]);

  // --- AÇÕES ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm || !currentUser) return;
    try {
      const usersRef = collection(db, "users");
      // Busca limitada para não estourar leituras
      const q = query(usersRef, limit(20));
      const snapshot = await getDocs(q);
      const term = searchTerm.toLowerCase().trim();
      const cleanTag = term.replace("#", "");

      const results = snapshot.docs
        .map((d) => d.data() as UserData)
        .filter((u) => {
          if (u.uid === currentUser.uid) return false;
          // Não mostra quem já é amigo
          const isFriend = friends.some((f) => f.uid === u.uid);
          const nameMatch =
            u.displayName && u.displayName.toLowerCase().includes(term);
          const tagMatch = u.userTag && u.userTag == cleanTag;
          const emailMatch = u.email && u.email.toLowerCase().includes(term);
          return (nameMatch || tagMatch || emailMatch) && !isFriend;
        });
      setSearchResults(results);
    } catch (err) {
      showToast("Erro ao buscar.", "error");
    }
  };

  const sendFriendRequest = async (targetUser: UserData) => {
    if (!currentUser) return;
    try {
      const qCheck = query(
        collection(db, "friend_requests"),
        where("from", "==", currentUser.uid),
        where("to", "==", targetUser.uid),
        where("status", "==", "pending"),
      );
      const checkSnap = await getDocs(qCheck);
      if (!checkSnap.empty) {
        showToast(`Já enviado!`, "error");
        return;
      }
      await addDoc(collection(db, "friend_requests"), {
        from: currentUser.uid,
        to: targetUser.uid,
        status: "pending",
        timestamp: new Date(),
      });
      showToast(`Convite enviado!`, "success");
      setSearchResults((prev) => prev.filter((p) => p.uid !== targetUser.uid));
    } catch (error) {
      showToast("Erro ao enviar.", "error");
    }
  };

  const acceptRequest = async (req: FriendRequest) => {
    try {
      const ref = doc(db, "friend_requests", req.requestId);
      await updateDoc(ref, {
        status: "accepted",
        streak: 0,
        lastInteraction: new Date(),
      });
      showToast(`Agora vocês são amigos!`, "success");
      setView("list");
    } catch (error) {
      showToast("Erro ao aceitar.", "error");
    }
  };

  const handleRemoveFriend = async () => {
    const friend = modalState.data;
    if (!friend || !friend.requestId) return;
    setActionStatus("loading");
    try {
      await deleteDoc(doc(db, "friend_requests", friend.requestId));
      showToast(`${friend.displayName} removido.`, "success");
      closeModal();
    } catch (error) {
      showToast("Erro ao remover.", "error");
    } finally {
      setActionStatus("idle");
    }
  };

  const handleSendMessage = async () => {
    const friend = modalState.data;
    if (!friend || !currentUser) return;
    setActionStatus("loading");
    try {
      const finalMessage =
        messageText.trim() || "te mandou um raio de energia! ⚡";
      await addDoc(collection(db, "notifications"), {
        from: currentUser.uid,
        fromName: currentUser.displayName,
        to: friend.uid,
        type: "energy",
        message: finalMessage,
        read: false,
        timestamp: new Date(),
      });

      if (friend.requestId) {
        await updateDoc(doc(db, "friend_requests", friend.requestId), {
          lastInteraction: new Date(),
        });
      }

      setActionStatus("success");
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setActionStatus("idle");
    }
  };

  const openModal = (type: "message" | "remove", data: any) => {
    setModalState({ type, data });
    setMessageText("");
    setActionStatus("idle");
  };
  const closeModal = () => setModalState({ type: null, data: null });

  return (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in duration-500 min-h-screen bg-slate-50 relative">
      {notification && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-xl font-bold text-sm animate-in slide-in-from-top-4 flex items-center gap-2 ${
            notification.type === "error"
              ? "bg-red-500 text-white"
              : "bg-slate-800 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <Check size={16} />
          ) : (
            <AlertCircle size={16} />
          )}{" "}
          {notification.message}
        </div>
      )}

      {/* HEADER TABS */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm mb-4 sticky top-0 z-30">
        <button
          onClick={() => setView("list")}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            view === "list" ? "bg-indigo-100 text-indigo-700" : "text-slate-400"
          }`}
        >
          <Users size={18} /> Galera
        </button>
        <button
          onClick={() => setView("search")}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            view === "search"
              ? "bg-indigo-100 text-indigo-700"
              : "text-slate-400"
          }`}
        >
          <Search size={18} /> Explorar
        </button>
        <button
          onClick={() => setView("requests")}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative ${
            view === "requests"
              ? "bg-indigo-100 text-indigo-700"
              : "text-slate-400"
          }`}
        >
          <UserPlus size={18} />
          {requests.length > 0 && (
            <span className="absolute top-1 right-3 bg-red-500 w-2.5 h-2.5 rounded-full animate-ping"></span>
          )}
        </button>
      </div>

      {/* VIEW: LISTA */}
      {view === "list" && (
        <div className="space-y-3">
          {loading && friends.length === 0 ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-indigo-500" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-10 opacity-60">
              <p className="text-5xl mb-4">🤷‍♂️</p>
              <p className="text-slate-600 font-medium">
                Sua lista está vazia.
              </p>
              <button
                onClick={() => setView("search")}
                className="text-indigo-600 font-bold mt-2 underline"
              >
                Adicionar amigos
              </button>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.uid}
                className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between transition-all active:scale-[0.98] relative overflow-hidden"
              >
                {friend.streak > 0 && (
                  <div className="absolute top-0 right-0 bg-orange-50 pl-3 pr-2 py-1 rounded-bl-2xl border-l border-b border-orange-100 flex items-center gap-1 z-10">
                    <span className="text-xs font-black text-orange-500">
                      {friend.streak}
                    </span>
                    <Flame
                      size={14}
                      className="fill-orange-500 text-orange-600 animate-pulse"
                    />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      {friend.photoURL ? (
                        <img
                          src={friend.photoURL}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        "👤"
                      )}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                        friend.finalBattery > 0
                          ? "bg-green-500"
                          : "bg-slate-300"
                      }`}
                    ></div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg leading-tight">
                      {friend.displayName?.split(" ")[0]}
                    </p>
                    {friend.status && (
                      <p className="text-xs text-indigo-600 italic font-medium my-0.5 truncate max-w-[140px]">
                        "{friend.status}"
                      </p>
                    )}
                    <div className="flex flex-col gap-0.5 mt-1">
                      <div
                        className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full w-fit ${
                          friend.finalBattery <= 20
                            ? "bg-red-100 text-red-600"
                            : friend.finalBattery <= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        <Battery size={10} className="fill-current" />{" "}
                        {friend.finalBattery}%
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-1">
                        <Clock size={10} /> {formatLastSeen(friend.lastLogin)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                  <button
                    onClick={() => openModal("remove", friend)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => openModal("message", friend)}
                    className="bg-yellow-400 text-yellow-900 w-11 h-11 rounded-full flex items-center justify-center shadow-md shadow-yellow-200 hover:bg-yellow-300 active:scale-95 transition-all"
                  >
                    <Zap size={22} className="fill-current" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW: BUSCA */}
      {view === "search" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-3">
              Encontrar Pessoas
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Nome, Tag (#1234) ou Email..."
                className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-indigo-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white p-3 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all"
              >
                <Search />
              </button>
            </form>
          </div>
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.uid}
                className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center animate-in slide-in-from-bottom-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-100">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">
                      {user.displayName}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit mt-1">
                      <Hash size={10} /> {user.userTag || "----"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => sendFriendRequest(user)}
                  className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                >
                  Convidar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: REQUESTS */}
      {view === "requests" && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-12 opacity-50">
              <Bell size={48} className="mx-auto mb-2 text-slate-300" />
              <p>Sem convites pendentes.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.requestId}
                className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 flex justify-between items-center animate-in slide-in-from-left-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-white shadow-sm">
                    {req.photoURL ? (
                      <img src={req.photoURL} className="w-full h-full" />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      {req.displayName}
                    </p>
                    <span className="text-xs text-slate-400">
                      quer ser seu amigo
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => acceptRequest(req)}
                  className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors shadow-sm"
                >
                  <Check size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL DE MENSAGEM */}
      {modalState.type === "message" && modalState.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Zap className="text-yellow-500 fill-current" size={20} />
                Mandar Energia
              </h3>
              <button
                onClick={closeModal}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
              >
                <X size={18} className="text-slate-600" />
              </button>
            </div>

            {actionStatus === "success" ? (
              <div className="py-10 text-center animate-in zoom-in">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check size={32} strokeWidth={3} />
                </div>
                <p className="font-bold text-green-600 text-lg">
                  Energia Enviada!
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-2 font-medium">
                  Para:{" "}
                  <span className="text-indigo-600 font-bold">
                    {modalState.data.displayName}
                  </span>
                </p>

                {/* TEXTAREA EXPANSÍVEL (ATUALIZADO) */}
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-slate-700 font-medium focus:outline-indigo-500 focus:bg-white transition-all resize-none h-40 overflow-y-auto leading-relaxed"
                  placeholder="Escreva sua mensagem aqui... (O app vai expandir se for grande)"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />

                <div className="flex flex-wrap gap-2 mb-6">
                  {quickMessages.map((msg) => (
                    <button
                      key={msg}
                      onClick={() => setMessageText(msg)}
                      className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-colors"
                    >
                      {msg}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={actionStatus === "loading"}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                >
                  {actionStatus === "loading" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      Enviar <Zap size={18} className="fill-current" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL REMOVER AMIGO */}
      {modalState.type === "remove" && modalState.data && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl text-center">
            <h3 className="font-bold text-lg text-slate-800 mb-2">
              Remover amigo?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl"
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
