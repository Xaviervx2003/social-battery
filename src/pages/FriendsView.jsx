import React, { useState, useEffect } from "react";
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, limit 
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Zap, Search, UserPlus, Check, X, Users, Loader2, Hash, MessageSquare, AlertCircle, Bell, Battery, Trash2, Clock, AlertTriangle } from "lucide-react";

export default function FriendsView({ currentUser }) {
  const [view, setView] = useState('list');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [notification, setNotification] = useState(null); 
  
  // MODAL DE MENSAGEM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sendingState, setSendingState] = useState("idle");

  // MODAL DE REMOVER AMIGO (NOVO)
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const quickMessages = ["Bora sair? 🍻", "Força aí! 💪", "Saudades! ❤️", "Acorda!! ⏰", "Qual a boa? 👀"];

  const showToast = (message, type = "success") => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000); 
  };

  // --- FUNÇÃO AUXILIAR: FORMATAR TEMPO (NOVA) ---
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Há muito tempo";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = (new Date() - date) / 1000; // Diferença em segundos

    if (diff < 60) return "Agora mesmo";
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
    return `Há ${Math.floor(diff / 86400)} dias`;
  };

  useEffect(() => {
    if (!currentUser?.uid) return;

    // A. Busca Pedidos (REAL TIME)
    const qRequests = query(collection(db, "friend_requests"), where("to", "==", currentUser.uid), where("status", "==", "pending"));
    const unsubRequests = onSnapshot(qRequests, async (snapshot) => {
      const reqs = [];
      for (const d of snapshot.docs) {
        const fromId = d.data().from;
        const userQ = query(collection(db, "users"), where("uid", "==", fromId));
        const userSnap = await getDocs(userQ);
        if (!userSnap.empty) {
          reqs.push({ requestId: d.id, ...userSnap.docs[0].data() });
        } else {
            reqs.push({ requestId: d.id, displayName: "Usuário Desconhecido", uid: fromId });
        }
      }
      setRequests(reqs);
    });

    // B. Busca Amigos
    const qFriends1 = query(collection(db, "friend_requests"), where("to", "==", currentUser.uid), where("status", "==", "accepted"));
    const qFriends2 = query(collection(db, "friend_requests"), where("from", "==", currentUser.uid), where("status", "==", "accepted"));

    const loadFriends = async () => {
        if (friends.length === 0) setLoading(true);
        
        try {
          const [snap1, snap2] = await Promise.all([getDocs(qFriends1), getDocs(qFriends2)]);
          
          // Precisamos guardar o ID DO PEDIDO (requestId) para poder deletar depois
          const friendMap = new Map(); // Map para evitar duplicatas e guardar o requestId

          snap1.forEach(d => friendMap.set(d.data().from, d.id)); // Eu recebi (amigo é 'from')
          snap2.forEach(d => friendMap.set(d.data().to, d.id));   // Eu enviei (amigo é 'to')

          if (friendMap.size === 0) {
              setFriends([]); setLoading(false); return;
          }

          const friendsList = [];
          for (const [fid, requestId] of friendMap) {
              if (fid === currentUser.uid) continue; 
              
              const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", fid)));
              if (!userSnap.empty) {
                  const data = userSnap.docs[0].data();
                  const bat = data.currentBattery ?? data.batteryLevel ?? 0;
                  
                  friendsList.push({ 
                      id: userSnap.docs[0].id, 
                      requestId: requestId, // <--- IMPORTANTE PARA REMOVER
                      ...data,
                      finalBattery: bat
                  });
              }
          }
          setFriends(friendsList.sort((a, b) => a.finalBattery - b.finalBattery));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    
    loadFriends();
    const interval = setInterval(loadFriends, 10000); // Atualiza a cada 10s
    return () => { unsubRequests(); clearInterval(interval); };
  }, [currentUser, view]); 

  // --- AÇÕES ---
  
  // 1. Remover Amigo (NOVA LÓGICA)
  const confirmRemoveFriend = (friend) => {
      setFriendToRemove(friend);
      setIsRemoveModalOpen(true);
  };

  const handleRemoveFriend = async () => {
      if (!friendToRemove || !friendToRemove.requestId) return;
      setIsRemoving(true);
      try {
          await deleteDoc(doc(db, "friend_requests", friendToRemove.requestId));
          setFriends(prev => prev.filter(f => f.uid !== friendToRemove.uid));
          showToast(`${friendToRemove.displayName} foi removido.`, "success");
          setIsRemoveModalOpen(false);
          setFriendToRemove(null);
      } catch (error) {
          console.error("Erro ao remover:", error);
          showToast("Erro ao remover amigo.", "error");
      } finally {
          setIsRemoving(false);
      }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    setLoading(true); 
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, limit(50));
        const snapshot = await getDocs(q);
        const term = searchTerm.toLowerCase().trim();
        const cleanTag = term.replace("#", "");
        
        const results = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() })) 
            .filter(u => {
                if (u.uid === currentUser.uid) return false;
                const isFriend = friends.some(f => f.uid === u.uid);
                const nameMatch = u.displayName && u.displayName.toLowerCase().includes(term);
                const tagMatch = u.userTag && u.userTag == cleanTag;
                const emailMatch = u.email && u.email.toLowerCase().includes(term);
                return (nameMatch || tagMatch || emailMatch) && !isFriend;
            });
        setSearchResults(results);
    } catch (err) { showToast("Erro ao buscar.", "error"); } finally { setLoading(false); }
  };

  const sendFriendRequest = async (targetUser) => {
    try {
        const qCheck = query(collection(db, "friend_requests"), where("from", "==", currentUser.uid), where("to", "==", targetUser.uid), where("status", "==", "pending"));
        const checkSnap = await getDocs(qCheck);
        if (!checkSnap.empty) { showToast(`Já enviado!`, "error"); return; }

        await addDoc(collection(db, "friend_requests"), { from: currentUser.uid, to: targetUser.uid, status: "pending", timestamp: new Date() });
        showToast(`Convite enviado!`, "success");
        setSearchResults(prev => prev.filter(p => p.uid !== targetUser.uid)); 
    } catch (error) { showToast("Erro ao enviar.", "error"); }
  };

  const acceptRequest = async (req) => {
    try {
        const ref = doc(db, "friend_requests", req.requestId);
        await updateDoc(ref, { status: "accepted" });
        showToast(`Agora vocês são amigos!`, "success");
        setView('list'); 
    } catch (error) { showToast("Erro ao aceitar.", "error"); }
  };

  const openMessageModal = (friend) => { setSelectedFriend(friend); setMessageText(""); setSendingState("idle"); setIsModalOpen(true); };

  const handleSendMessage = async () => {
    if (!selectedFriend) return;
    setSendingState("sending");
    try {
        const finalMessage = messageText.trim() || "te mandou um raio de energia! ⚡";
        await addDoc(collection(db, "notifications"), { from: currentUser.uid, fromName: currentUser.displayName, to: selectedFriend.uid, type: "energy", message: finalMessage, read: false, timestamp: new Date() });
        setSendingState("sent");
        setTimeout(() => { setIsModalOpen(false); setSendingState("idle"); }, 1500);
    } catch (err) { setSendingState("idle"); }
  };

  // --- RENDER ---
  return (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in duration-500 min-h-screen bg-slate-50 relative">
      
      {notification && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-xl font-bold text-sm animate-in slide-in-from-top-4 flex items-center gap-2 ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}`}>
              {notification.type === 'success' ? <Check size={16}/> : <AlertCircle size={16}/>} {notification.message}
          </div>
      )}

      {/* MENU */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm mb-4">
        <button onClick={() => setView('list')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${view === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}><Users size={18}/> Amigos</button>
        <button onClick={() => setView('search')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${view === 'search' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}><Search size={18}/> Explorar</button>
        <button onClick={() => setView('requests')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative ${view === 'requests' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}><UserPlus size={18}/>{requests.length > 0 && <span className="absolute top-1 right-2 bg-red-500 w-2 h-2 rounded-full animate-ping"></span>}</button>
      </div>

      {/* LISTA DE AMIGOS */}
      {view === 'list' && (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 px-2">Sua Galera</h2>
            {loading && friends.length === 0 ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500"/></div> : 
             friends.length === 0 ? <div className="text-center py-10 opacity-60"><p className="text-4xl mb-2">🤷‍♂️</p><p>Ninguém aqui.</p><button onClick={() => setView('search')} className="text-indigo-600 font-bold mt-2 underline">Buscar</button></div> : 
             friends.map(friend => (
                <div key={friend.uid} className="relative group bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md">
                    
                    {/* INFO DO AMIGO */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                             {friend.photoURL ? <img src={friend.photoURL} className="w-full h-full object-cover"/> : "👤"}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-lg leading-tight">{friend.displayName?.split(" ")[0]}</p>
                            
                            {/* BATERIA & ULTIMO VISTO */}
                            <div className="flex flex-col gap-1 mt-1">
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full w-fit
                                    ${friend.finalBattery <= 20 ? 'bg-red-100 text-red-600' : 
                                      friend.finalBattery <= 50 ? 'bg-yellow-100 text-yellow-700' : 
                                      'bg-green-100 text-green-700'}
                                `}>
                                    <Battery size={12} className="fill-current"/> 
                                    {friend.finalBattery}%
                                </div>
                                
                                {/* NOVO: Texto de Visto por Último */}
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-1">
                                    <Clock size={10} /> {formatLastSeen(friend.lastLogin)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* BOTÕES DE AÇÃO */}
                    <div className="flex items-center gap-2">
                        {/* Botão Remover (Pequeno e discreto) */}
                        <button
                            onClick={() => confirmRemoveFriend(friend)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>

                        {/* Botão Raio (Grande) */}
                        <button
                            onClick={() => openMessageModal(friend)}
                            className="bg-yellow-400 text-yellow-900 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-300 active:scale-95 transition-all"
                        >
                            <Zap size={24} className="fill-current" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* MODAL MENSAGEM */}
      {isModalOpen && selectedFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">Mandar energia para <span className="text-indigo-600">{selectedFriend.displayName?.split(" ")[0]}</span></h3>
                    <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:bg-slate-200"><X size={18} /></button>
                </div>
                {sendingState === "sent" ? <div className="text-center py-8"><div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><Check size={32} /></div><p className="font-bold text-green-600">Enviado!</p></div> : 
                <>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-indigo-500 min-h-[100px] resize-none mb-4" placeholder="Escreva algo..." value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                    <div className="flex flex-wrap gap-2 mb-6">{quickMessages.map((msg) => (<button key={msg} onClick={() => setMessageText(msg)} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 hover:text-indigo-600 transition-colors border border-slate-200">{msg}</button>))}</div>
                    <button onClick={handleSendMessage} disabled={sendingState === "sending"} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70">{sendingState === "sending" ? <Loader2 className="animate-spin" /> : <><Zap className="fill-current" /> Enviar</>}</button>
                </>}
            </div>
        </div>
      )}

      {/* NOVO: MODAL DE CONFIRMAÇÃO DE REMOÇÃO */}
      {isRemoveModalOpen && friendToRemove && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Remover amigo?</h3>
                <p className="text-sm text-slate-500 mb-6">
                    Tem certeza que deseja remover <strong>{friendToRemove.displayName}</strong>?
                </p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsRemoveModalOpen(false)}
                        className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleRemoveFriend}
                        disabled={isRemoving}
                        className="flex-1 py-3 font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                        {isRemoving ? <Loader2 size={16} className="animate-spin"/> : "Remover"}
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* BUSCA */}
      {view === 'search' && (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 px-2">Adicionar Pessoas</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
                <input type="text" placeholder="Nome, Tag ou Email..." className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-indigo-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl font-bold">{loading ? <Loader2 className="animate-spin" /> : <Search />}</button>
            </form>
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl text-xs flex items-center gap-2 border border-yellow-100"><AlertCircle size={16} className="shrink-0"/><p>Busque por <strong>email</strong> se não encontrar pelo nome.</p></div>
            <div className="space-y-2 mt-4">{searchResults.map(user => (
                <div key={user.uid} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-100">{user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : "👤"}</div><div><span className="font-bold text-slate-700 block">{user.displayName}</span><span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit mt-1"><Hash size={10} /> {user.userTag || "----"}</span></div></div>
                    <button onClick={() => sendFriendRequest(user)} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-200 transition-colors">Convidar</button>
                </div>
            ))}{searchResults.length === 0 && searchTerm && !loading && <p className="text-center text-slate-400 text-sm">Nada encontrado.</p>}</div>
        </div>
      )}

      {/* SOLICITAÇÕES */}
      {view === 'requests' && (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 px-2 flex items-center gap-2">Solicitações {requests.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">{requests.length}</span>}</h2>
            {requests.length === 0 ? <div className="text-center py-10 opacity-50"><Bell size={48} className="mx-auto mb-2 text-slate-300"/><p>Sem convites pendentes.</p></div> : 
            requests.map(req => (
                <div key={req.requestId} className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 flex justify-between items-center animate-in slide-in-from-left-2">
                    <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-white shadow-sm">{req.photoURL ? <img src={req.photoURL} className="w-full h-full" /> : "👤"}</div><div><p className="font-bold text-slate-800">{req.displayName}</p><span className="text-xs text-slate-400">#{req.userTag || "----"}</span></div></div>
                    <div className="flex gap-2"><button onClick={() => acceptRequest(req)} className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors shadow-sm"><Check size={20} /></button></div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}