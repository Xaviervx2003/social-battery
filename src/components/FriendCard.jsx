import React from "react";
import { getModeInfo } from "../utils/batteryHelpers";

export default function FriendCard({ friend }) {
  // Boa prática: Desestruturação das props e definição de valores padrão
  const { id, batteryLevel = 0, lastUpdate } = friend;
  const modeInfo = getModeInfo(batteryLevel);

  // Formatação de data simples (Função auxiliar interna ou extraída para utils)
  const formattedTime = lastUpdate 
    ? new Date(lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "";

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md hover:scale-[1.02]">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full ${modeInfo.avatarBg} flex items-center justify-center text-xl shadow-inner`}>
          {batteryLevel <= 20 ? "😴" : batteryLevel <= 50 ? "😐" : batteryLevel <= 80 ? "🙂" : "🤩"}
        </div>
        
        <div>
          <h3 className="font-bold text-slate-700 capitalize text-sm">
            {id.replace(/_/g, " ")}
          </h3>
          <p className="text-xs text-slate-400 font-medium flex gap-1">
            {modeInfo.mode}
            {formattedTime && <span>• {formattedTime}</span>}
          </p>
        </div>
      </div>

      <div className="text-right">
        <span className={`text-lg font-bold ${modeInfo.color}`}>
          {batteryLevel}%
        </span>
      </div>
    </div>
  );
}