import React, { useState, useEffect } from "react";
import { Bell, Clock, BatteryCharging, Cloud, Check } from "lucide-react";

// Imports organizados (Clean Code)
import { getModeInfo } from "../utils/batteryHelpers";
import { useBatterySync } from "../hooks/useBatterySync"; // Lógica isolada
import { BatterySlider, BottomMenu } from "../components"; // Componentes visuais
import FriendsView from "./FriendsView"; // Páginas
import InsightsView from "./InsightsView";

export default function HomePage({ user, initialLevel }) {
  const [activeTab, setActiveTab] = useState("home");
  const [batteryLevel, setBatteryLevel] = useState(initialLevel || 65);
  const [rechargeTime, setRechargeTime] = useState(null);

  // Hook customizado cuidando do salvamento silenciosamente
  const { saveStatus } = useBatterySync(user, batteryLevel);

  // Dados visuais
  const currentMode = getModeInfo(batteryLevel);
  const ModeIcon = currentMode.icon;

  // Atualiza se vier dado novo do pai
  useEffect(() => {
    if (initialLevel !== undefined) setBatteryLevel(initialLevel);
  }, [initialLevel]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative w-full">
      <div className="flex-1 overflow-y-auto pb-20">
        
        {/* === TELA HOME === */}
        {activeTab === "home" && (
          <div className="space-y-6 animate-in fade-in duration-500 pt-4 px-2">
            
            {/* Cabeçalho */}
            <div className="flex justify-between items-center px-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Olá, {user?.name || "Visitante"}
                </h2>
                {/* Status de Salvamento (Feedback Visual) */}
                <div className="h-4 flex items-center text-xs font-medium transition-all">
                  {saveStatus === "waiting" && <span className="text-amber-500">Alterações pendentes...</span>}
                  {saveStatus === "saving" && <span className="text-blue-500 flex items-center gap-1"><Cloud size={12} className="animate-pulse"/> Salvando...</span>}
                  {saveStatus === "saved" && <span className="text-green-600 flex items-center gap-1"><Check size={12}/> Salvo</span>}
                  {saveStatus === "idle" && <span className="text-slate-400">Sincronizado</span>}
                </div>
              </div>
              <Bell className="text-slate-600 cursor-pointer hover:text-slate-800 transition-colors" size={24} />
            </div>

            {/* Card Principal Colorido */}
            <div className={`rounded-3xl p-6 shadow-xl text-white transition-all duration-700 bg-gradient-to-br ${currentMode.accent}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                  <ModeIcon size={24} className="text-white" />
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-bold">{batteryLevel}%</h1>
                  <p className="text-white/80 text-sm font-medium">
                    {currentMode.mode}
                  </p>
                </div>
              </div>

              {/* Emoji Central */}
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

              <BatterySlider
                batteryLevel={batteryLevel}
                onChange={setBatteryLevel}
              />
              <p className="text-center text-white/70 text-sm mt-2 font-medium">
                {currentMode.desc}
              </p>
            </div>

            {/* Seletor de Recarga Rápida */}
            {batteryLevel < 50 && !rechargeTime && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mx-2 animate-in slide-in-from-bottom-2">
                <p className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                  <BatteryCharging size={16} /> Definir tempo de recarga?
                </p>
                <div className="flex gap-2">
                  {[1, 2, 4].map((h) => (
                    <button
                      key={h}
                      onClick={() => setRechargeTime(`${h}h`)}
                      className="flex-1 py-2 text-xs font-semibold bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 active:scale-95 transition-all border border-slate-200"
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === OUTRAS TELAS === */}
        {activeTab === "friends" && <FriendsView />}
        {activeTab === "insights" && <InsightsView />}
        {activeTab === "notifications" && <div className="p-10 text-center text-slate-400">Sem notificações novas.</div>}
      </div>

      <BottomMenu
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={0}
      />
    </div>
  );
}