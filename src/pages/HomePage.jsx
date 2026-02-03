import React, { useState, useEffect, useRef } from "react";
import { Bell, Clock, BatteryCharging, Cloud, Check, LogOut, Loader2, Hash, RefreshCw, MessageCircle, Ghost } from "lucide-react";
import NotificationsView from "./NotificationsView";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getModeInfo } from "../utils/batteryHelpers";
import { useBatterySync } from "../hooks/useBatterySync";
import { BatterySlider, BottomMenu } from "../components";
import FriendsView from "./FriendsView";
import InsightsView from "./InsightsView";

export default function HomePage({ user, initialLevel, onLogout }) {
  const [activeTab, setActiveTab] = useState("home");
  const [batteryLevel, setBatteryLevel] = useState(initialLevel || 65);
  const [statusText, setStatusText] = useState(user?.status || "");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  
  // NOVO: Estado Ghost Mode
  const [isGhostMode, setIsGhostMode] = useState(user?.isGhostMode || false);
  
  const [rechargeTime, setRechargeTime] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [localTag, setLocalTag] = useState(user?.userTag || null);

  // Passamos o estado atualizado do user para o hook saber se bloqueia ou não
  const userWithGhost = { ...user, isGhostMode }; 
  const { saveStatus } = useBatterySync(userWithGhost, batteryLevel);
  
  const currentMode = getModeInfo(batteryLevel);
  const ModeIcon = currentMode.icon;
  const statusTimeoutRef = useRef(null);

  useEffect(() => {
    if (initialLevel !== undefined) setBatteryLevel(initialLevel);
    if (user?.status) setStatusText(user.status);
    if (user?.isGhostMode !== undefined) setIsGhostMode(user.isGhostMode);
  }, [initialLevel, user]);

  useEffect(() => {
    if (user?.userTag) setLocalTag(user.userTag);
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "notifications"),
      where("to", "==", user.uid), 
      where("read", "==", false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => setUnreadCount(snapshot.size));
    return () => unsubscribe();
  }, [user]);

  // --- TOGGLE GHOST MODE ---
  const toggleGhostMode = async () => {
      if (!user?.uid) return;
      const newValue = !isGhostMode;
      setIsGhostMode(newValue); // Atualiza visual na hora

      try {
          await updateDoc(doc(db, "users", user.uid), {
              isGhostMode: newValue,
              // Se ativou, força o status para Congelado. Se desativou, limpa ou volta pro anterior.
              status: newValue ? "Congelado ❄️" : "" 
          });
          if (newValue) setStatusText("Congelado ❄️");
          else setStatusText("");
      } catch (error) {
          console.error("Erro ghost mode:", error);
          setIsGhostMode(!newValue); // Reverte se der erro
      }
  };

  const handleStatusChange = (e) => {
    const text = e.target.value;
    setStatusText(text);
    setIsSavingStatus(true);
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = setTimeout(async () => {
        if (!user?.uid) return;
        try {
            await updateDoc(doc(db, "users", user.uid), { status: text });
            setIsSavingStatus(false);
        } catch (error) { setIsSavingStatus(false); }
    }, 1500);
  };

  const handleForceCreateTag = async () => {
    if (!user?.uid) return;
    const newTag = Math.floor(1000 + Math.random() * 9000).toString();
    const searchName = user.displayName ? user.displayName.toLowerCase() : "usuario";
    try {
        await updateDoc(doc(db, "users", user.uid), { userTag: newTag, searchName: searchName });
        setLocalTag(newTag);
        alert(`Tag criada: #${newTag}`);
    } catch (error) { console.error(error); }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col relative w-full transition-colors duration-700 
        ${isGhostMode ? "bg-slate-200" : "bg-slate-50"}
    `}>
      <div className="flex-1 overflow-y-auto pb-20">
        
        {activeTab === "home" && (
          <div className="space-y-6 animate-in fade-in duration-500 pt-4 px-2">
            
            {/* HEADER */}
            <div className="flex justify-between items-center px-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  Olá, {user?.displayName?.split(" ")[0] || "Visitante"}
                </h2>
                <div className="flex items-center gap-2 mb-1">
                    {localTag ? (
                        <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-100">
                            <Hash size={10} /> {localTag}
                        </span>
                    ) : (
                        <button onClick={handleForceCreateTag} className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-red-600 animate-pulse">
                            <RefreshCw size={10} /> Gerar Tag
                        </button>
                    )}
                    
                    {/* STATUS DE SALVAMENTO OU GHOST */}
                    <div className="h-5 flex items-center text-xs font-medium transition-all">
                        {isGhostMode ? (
                            <span className="text-slate-500 flex items-center gap-1 font-bold">
                                <Ghost size={12} /> Invisível
                            </span>
                        ) : (
                            <>
                                {saveStatus === "waiting" && <span className="text-amber-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> ...</span>}
                                {saveStatus === "saving" && <span className="text-blue-500 flex items-center gap-1"><Cloud size={10} className="animate-pulse"/> Salvando...</span>}
                                {saveStatus === "saved" && <span className="text-green-600 flex items-center gap-1"><Check size={10}/> Salvo</span>}
                            </>
                        )}
                    </div>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                
                {/* BOTÃO GHOST MODE */}
                <button 
                    onClick={toggleGhostMode}
                    className={`p-2 rounded-full shadow-sm transition-all active:scale-95 ${isGhostMode ? 'bg-indigo-600 text-white shadow-indigo-300' : 'bg-white text-slate-400 hover:text-indigo-500'}`}
                >
                    <Ghost size={20} className={isGhostMode ? "animate-pulse" : ""} />
                </button>

                <div className="relative cursor-pointer" onClick={() => setActiveTab("notifications")}>
                  <Bell className="text-slate-400 hover:text-indigo-500 transition-colors" size={24} />
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">{unreadCount}</span>}
                </div>
                <button onClick={onLogout} className="bg-white p-2 rounded-full shadow-sm text-slate-400 hover:text-red-500">
                  <LogOut size={20} />
                </button>
              </div>
            </div>

            {/* CARD PRINCIPAL (GHOST EFFECT) */}
            <div className={`rounded-3xl p-6 shadow-xl text-white transition-all duration-700 relative overflow-hidden
                ${isGhostMode ? 'bg-slate-400 grayscale' : `bg-gradient-to-br ${currentMode.accent}`}
            `}>
              {isGhostMode && (
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
                      <div className="bg-slate-800/80 px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2">
                          <Ghost size={14}/> Modo Fantasma Ativo
                      </div>
                  </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                  <ModeIcon size={24} className="text-white" />
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-bold">{batteryLevel}%</h1>
                  <p className="text-white/80 text-sm font-medium">{currentMode.mode}</p>
                </div>
              </div>

              <div className="flex justify-center mb-8">
                <div className={`w-32 h-32 rounded-full ${currentMode.avatarBg} border-4 border-white/30 flex items-center justify-center shadow-lg transition-colors duration-500 relative`}>
                  <span className="text-5xl select-none">
                    {batteryLevel <= 20 ? "😴" : batteryLevel <= 50 ? "😐" : batteryLevel <= 80 ? "🙂" : "🤩"}
                  </span>
                  {rechargeTime && !isGhostMode && (
                    <div className="absolute -bottom-2 bg-white text-slate-800 text-xs px-2 py-1 rounded-full shadow-md flex items-center gap-1 animate-bounce">
                      <Clock size={10} /> {rechargeTime}
                    </div>
                  )}
                </div>
              </div>

              <BatterySlider batteryLevel={batteryLevel} onChange={setBatteryLevel} />
              
              <p className="text-center text-white/70 text-sm mt-4 font-medium min-h-[20px]">
                {currentMode.desc}
              </p>
            </div>

            {/* STATUS / NOTES */}
            <div className="relative mx-2">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <MessageCircle size={18} />
                </div>
                <input 
                    type="text" 
                    maxLength={60}
                    placeholder="O que está acontecendo? (Ex: Estudando 📚)"
                    value={statusText}
                    onChange={handleStatusChange}
                    disabled={isGhostMode} // Bloqueia digitação no modo fantasma
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl shadow-sm border text-slate-700 placeholder:text-slate-400 focus:outline-indigo-500 transition-all text-sm font-medium
                        ${isGhostMode ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' : 'bg-white border-slate-100'}
                    `}
                />
                {isSavingStatus && !isGhostMode && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 size={14} className="animate-spin text-indigo-500" />
                    </div>
                )}
            </div>
            
             {/* BOTÕES DE RECARGA */}
             {batteryLevel < 50 && !rechargeTime && !isGhostMode && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mx-2 animate-in slide-in-from-bottom-2">
                <p className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                  <BatteryCharging size={16} /> Definir tempo de recarga?
                </p>
                <div className="flex gap-2">
                  {[1, 2, 4].map((h) => (
                    <button key={h} onClick={() => setRechargeTime(`${h}h`)} className="flex-1 py-2 text-xs font-semibold bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 border border-slate-200">
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "friends" && <FriendsView currentUser={user} />}
        {activeTab === "insights" && <InsightsView currentUser={user} />}
        {activeTab === "notifications" && <NotificationsView currentUser={user} />}

      </div>
      
      <BottomMenu activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount} />
    </div>
  );
}