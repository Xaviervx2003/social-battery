import React from "react";
import { Bell, Clock, BatteryCharging } from "lucide-react";
import { getModeInfo } from "../utils/batteryUtils";
import BatterySlider from "../components/BatterySlider";

export default function HomeView({
  batteryLevel,
  setBatteryLevel,
  rechargeTime,
  setRechargeTime,
  friends,
  unreadCount,
  setActiveTab,
}) {
  const currentMode = getModeInfo(batteryLevel);
  const ModeIcon = currentMode.icon;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center pt-4 px-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Olá, Rafa</h2>
          <p className="text-sm text-slate-500">Cuide da sua energia hoje.</p>
        </div>
        <button
          onClick={() => setActiveTab("notifications")}
          className="relative"
        >
          <Bell className="text-slate-600" size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white text-white text-xs flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Card */}
      <div
        className={`rounded-3xl p-6 shadow-xl text-white transition-colors duration-500 bg-gradient-to-br ${currentMode.accent}`}
      >
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

        {/* Avatar Status */}
        <div className="flex justify-center mb-8">
          <div
            className={`w-32 h-32 rounded-full ${currentMode.avatarBg} border-4 border-white/30 flex items-center justify-center shadow-lg transition-colors duration-500 relative`}
          >
            <span className="text-5xl">
              {batteryLevel <= 20
                ? "😴"
                : batteryLevel <= 50
                  ? "😐"
                  : batteryLevel <= 80
                    ? "🙂"
                    : "🤩"}
            </span>
            {rechargeTime && (
              <div className="absolute -bottom-2 bg-white text-slate-800 text-xs px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                <Clock size={10} /> {rechargeTime}
              </div>
            )}
          </div>
        </div>

        {/* Slider Component */}
        <BatterySlider
          batteryLevel={batteryLevel}
          onChange={(val) => {
            setBatteryLevel(val);
            setRechargeTime(null);
          }}
        />
        <p className="text-center text-white/70 text-sm mt-2">
          {currentMode.desc}
        </p>
      </div>

      {/* Recharge Selector */}
      {batteryLevel < 50 && !rechargeTime && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
            <BatteryCharging size={16} /> Definir tempo de recarga?
          </p>
          <div className="flex gap-2">
            {[1, 2, 4].map((h) => (
              <button
                key={h}
                onClick={() => setRechargeTime(`${h}h`)}
                className="flex-1 py-2 text-xs font-semibold bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 border border-slate-200"
              >
                {h}h
              </button>
            ))}
            <button
              onClick={() => setRechargeTime("Amanhã")}
              className="flex-1 py-2 text-xs font-semibold bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 border border-slate-200"
            >
              Até Amanhã
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
