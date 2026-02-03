import React, { useState, useEffect } from "react";
import { Bell, Clock, BatteryCharging, Cloud, Check, LogOut, Loader2, Hash, RefreshCw } from "lucide-react";
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
  const [rechargeTime, setRechargeTime] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Estado local para garantir que a Tag apareça assim que for criada
  const [localTag, setLocalTag] = useState(user?.userTag || null);

  // Hook Automático
  const { saveStatus } = useBatterySync(user, batteryLevel);

  const currentMode = getModeInfo(batteryLevel);
  const ModeIcon = currentMode.icon;

  useEffect(() => {
    if (initialLevel !== undefined) setBatteryLevel(initialLevel);
  }, [initialLevel]);

  useEffect(() => {
    if (user?.userTag) setLocalTag(user.userTag);
  }, [user]);

  // Monitora Notificações
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

  // --- FUNÇÃO DE EMERGÊNCIA: GERAR TAG MANUALMENTE ---
  const handleForceCreateTag = async () => {
    if (!user?.uid) return;
    
    const newTag = Math.floor(1000 + Math.random() * 9000).toString();
    const searchName = user.displayName ? user.displayName.toLowerCase() : "usuario";
    
    try {
        await updateDoc(doc(db, "users", user.uid), {
            userTag: newTag,
            searchName: searchName
        });
        setLocalTag(newTag); // Atualiza na tela na hora
        alert(`Sua Tag foi criada: #${newTag}`);
    } catch (error) {
        console.error("Erro ao criar tag:", error);
        alert("Erro ao criar tag. Verifique o console.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative w-full">
      <div className="flex-1 overflow-y-auto pb-20">
        
        {activeTab === "home" && (
          <div className="space-y-6 animate-in fade-in duration-500 pt-4 px-2">
            
            <div className="flex justify-between items-center px-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  Olá, {user?.displayName?.split(" ")[0] || "Visitante"}
                </h2>
                
                {/* --- ÁREA DA TAG --- */}
                <div className="flex items-center gap-2 mb-1">
                    {localTag ? (
                        <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-100">
                            <Hash size={10} /> {localTag}
                        </span>
                    ) : (
                        // BOTÃO DE CORREÇÃO SE A TAG NÃO EXISTIR
                        <button 
                            onClick={handleForceCreateTag}
                            className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-red-600 animate-pulse"
                        >
                            <RefreshCw size={10} /> Gerar Tag
                        </button>
                    )}
                    
                    <div className="h-5 flex items-center text-xs font-medium transition-all">
                        {saveStatus === "waiting" && <span className="text-amber-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> ...</span>}
                        {saveStatus === "saving" && <span className="text-blue-500 flex items-center gap-1"><Cloud size={10} className="animate-pulse"/> Salvando...</span>}
                        {saveStatus === "saved" && <span className="text-green-600 flex items-center gap-1"><Check size={10}/> Salvo</span>}
                    </div>
                </div>

              </div>

              <div className="flex gap-4 items-center">
                <div className="relative cursor-pointer" onClick={() => setActiveTab("notifications")}>
                  <Bell className="text-slate-400 hover:text-indigo-500 transition-colors" size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button onClick={onLogout} className="bg-white p-2 rounded-full shadow-sm text-slate-400 hover:text-red-500">
                  <LogOut size={20} />
                </button>
              </div>
            </div>

            {/* CARD PRINCIPAL */}
            <div className={`rounded-3xl p-6 shadow-xl text-white transition-all duration-700 bg-gradient-to-br ${currentMode.accent}`}>
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
                  {rechargeTime && (
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
            
             {batteryLevel < 50 && !rechargeTime && (
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