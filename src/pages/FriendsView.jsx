import React, { useState, useEffect } from "react";
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs 
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FriendCard } from "../components"; 
import { Zap, Search, UserPlus, Check, X, Users, Loader2, Hash } from "lucide-react";

export default function FriendsView({ currentUser }) {
  const [view, setView] = useState('list'); // 'list' | 'search' | 'requests'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingEnergy, setSendingEnergy] = useState(null);

  // --- 1. BUSCAR AMIGOS E SOLICITAÇÕES ---
  useEffect(() => {
    if (!currentUser?.uid) return;

    // A. Busca Pedidos de Amizade (Recebidos)
    const qRequests = query(
      collection(db, "friend_requests"),
      where("to", "==", currentUser.uid),
      where("status", "==", "pending")
    );

    const unsubRequests = onSnapshot(qRequests, async (snapshot) => {
      const reqs = [];
      for (const d of snapshot.docs) {
        // Busca dados de quem enviou
        const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", d.data().from)));
        if (!userDoc.empty) {
          reqs.push({ requestId: d.id, ...userDoc.docs[0].data() });
        }
      }
      setRequests(reqs);
    });

    // B. Busca Meus Amigos (Aceitos)
    const qFriends1 = query(collection(db, "friend_requests"), where("to", "==", currentUser.uid), where("status", "==", "accepted"));
    const qFriends2 = query(collection(db, "friend_requests"), where("from", "==", currentUser.uid), where("status", "==", "accepted"));

    const loadFriends = async () => {
        setLoading(true);
        const [snap1, snap2] = await Promise.all([getDocs(qFriends1), getDocs(qFriends2)]);
        
        const friendIds = new Set();
        snap1.forEach(d => friendIds.add(d.data().from));
        snap2.forEach(d => friendIds.add(d.data().to));

        if (friendIds.size === 0) {
            setFriends([]);
            setLoading(false);
            return;
        }

        // Busca os dados atuais desses amigos
        const friendsList = [];
        for (const fid of friendIds) {
            const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", fid)));
            if (!userSnap.empty) {
                friendsList.push({ id: userSnap.docs[0].id, ...userSnap.docs[0].data() });
            }
        }
        // Ordena por quem tem MENOS bateria (quem precisa mais de ajuda aparece primeiro)
        setFriends(friendsList.sort((a, b) => (a.currentBattery || 0) - (b.currentBattery || 0)));
        setLoading(false);
    };

    loadFriends();
    const interval = setInterval(loadFriends, 30000); // Atualiza a cada 30s

    return () => {
        unsubRequests();
        clearInterval(interval);
    };
  }, [currentUser, view]); 

  // --- 2. FUNÇÕES DE AÇÃO ---

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    
    // MELHORIA 1: Converte para minúsculo para a busca funcionar sempre
    const term = searchTerm.toLowerCase();
    
    // MELHORIA 2: Busca no campo 'searchName' em vez de displayName
    const q = query(
        collection(db, "users"), 
        where("searchName", ">=", term),
        where("searchName", "<=", term + '\uf8ff')
    );
    
    const snap = await getDocs(q);
    const results = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.uid !== currentUser.uid); // Não mostra eu mesmo
    
    setSearchResults(results);
  };

  const sendFriendRequest = async (targetUser) => {
    try {
        await addDoc(collection(db, "friend_requests"), {
            from: currentUser.uid,
            to: targetUser.uid,
            status: "pending",
            timestamp: new Date()
        });
        alert(`Convite enviado para ${targetUser.displayName}!`);
        // Remove da lista visualmente para dar feedback imediato
        setSearchResults(prev => prev.filter(p => p.uid !== targetUser.uid)); 
    } catch (error) {
        console.error("Erro ao enviar convite:", error);
    }
  };

  const acceptRequest = async (req) => {
    try {
        const ref = doc(db, "friend_requests", req.requestId);
        await updateDoc(ref, { status: "accepted" });
        setView('list'); // Volta para a lista para ver o novo amigo
    } catch (error) {
        console.error("Erro ao aceitar:", error);
    }
  };

  const sendEnergy = async (friend) => {
    setSendingEnergy(friend.uid);
    try {
        await addDoc(collection(db, "notifications"), {
            from: currentUser.uid,
            fromName: currentUser.displayName,
            to: friend.uid,
            type: "energy",
            message: "te mandou um raio de energia! ⚡",
            read: false,
            timestamp: new Date()
        });
        setTimeout(() => setSendingEnergy(null), 1500);
    } catch (err) {
        console.error(err);
        setSendingEnergy(null);
    }
  };

  // --- 3. RENDERIZAÇÃO ---

  return (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in duration-500 min-h-screen bg-slate-50">
      
      {/* MENU SUPERIOR (ABAS) */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm mb-4">
        <button 
            onClick={() => setView('list')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2
            ${view === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}
        >
            <Users size={18}/> Amigos
        </button>
        <button 
            onClick={() => setView('search')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2
            ${view === 'search' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}
        >
            <Search size={18}/> Explorar
        </button>
        <button 
            onClick={() => setView('requests')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative
            ${view === 'requests' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}
        >
            <UserPlus size={18}/>
            {requests.length > 0 && (
                <span className="absolute top-1 right-2 bg-red-500 w-2 h-2 rounded-full animate-ping"></span>
            )}
        </button>
      </div>

      {/* --- ABA 1: LISTA DE AMIGOS --- */}
      {view === 'list' && (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 px-2">Sua Galera</h2>
            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500"/></div>
            ) : friends.length === 0 ? (
                <div className="text-center py-10 opacity-60">
                    <p className="text-4xl mb-2">🤷‍♂️</p>
                    <p>Você ainda não tem conexões.</p>
                    <button onClick={() => setView('search')} className="text-indigo-600 font-bold mt-2 underline">Buscar pessoas</button>
                </div>
            ) : (
                friends.map(friend => (
                    <div key={friend.uid} className="relative group">
                        <FriendCard friend={friend} />
                        <button
                            onClick={() => sendEnergy(friend)}
                            disabled={sendingEnergy === friend.uid}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-lg transition-all border-2 border-white
                                ${sendingEnergy === friend.uid ? "bg-green-500 text-white scale-110" : "bg-yellow-400 text-yellow-900 hover:bg-yellow-300"}
                            `}
                        >
                            <Zap size={20} className={sendingEnergy === friend.uid ? "animate-bounce" : "fill-current"} />
                        </button>
                    </div>
                ))
            )}
        </div>
      )}

      {/* --- ABA 2: BUSCAR PESSOAS --- */}
      {view === 'search' && (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 px-2">Adicionar Pessoas</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Nome do amigo..." 
                    className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-indigo-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl font-bold">
                    <Search />
                </button>
            </form>

            <div className="space-y-2 mt-4">
                {searchResults.map(user => (
                    <div key={user.uid} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-100">
                                {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-lg">👤</span>}
                            </div>
                            <div>
                                <span className="font-bold text-slate-700 block">{user.displayName}</span>
                                
                                {/* MELHORIA 3: Exibe a TAG segura (#1234) */}
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit mt-1">
                                    <Hash size={10} /> {user.userTag || "----"}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => sendFriendRequest(user)}
                            className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-200 transition-colors"
                        >
                            Convidar
                        </button>
                    </div>
                ))}
                {searchResults.length === 0 && searchTerm && <p className="text-center text-slate-400 text-sm">Ninguém encontrado.</p>}
            </div>
        </div>
      )}

      {/* --- ABA 3: SOLICITAÇÕES --- */}
      {view === 'requests' && (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 px-2 flex items-center gap-2">
                Solicitações Pendentes
                {requests.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{requests.length}</span>}
            </h2>
            
            {requests.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                    <p className="text-3xl mb-2">📭</p>
                    <p>Tudo limpo por aqui.</p>
                </div>
            ) : (
                requests.map(req => (
                    <div key={req.requestId} className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 flex justify-between items-center animate-in slide-in-from-left-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl border border-white shadow-sm overflow-hidden">
                                {req.photoURL ? <img src={req.photoURL} className="w-full h-full" /> : "👤"}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">{req.displayName}</p>
                                {/* Mostra a TAG aqui também para confirmar quem é */}
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                   <Hash size={10}/> {req.userTag || "----"} quer ver sua bateria
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => acceptRequest(req)} 
                                className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
                            >
                                <Check size={20} />
                            </button>
                            <button className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      )}

    </div>
  );
}