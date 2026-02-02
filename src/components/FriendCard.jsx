import React, { useState } from "react";
import { Zap, Check } from "lucide-react";
import { getModeInfo } from "../utils/batteryHelpers";
import { collection, addDoc } from "firebase/firestore"; // Importamos addDoc
import { db, auth } from "../firebaseConfig"; // Importamos auth para saber QUEM está mandando

export default function FriendCard({ friend }) {
  const { id, name, photo, batteryLevel = 0, lastUpdate } = friend;
  const [sent, setSent] = useState(false);
  
  const modeInfo = getModeInfo(batteryLevel);
  const displayName = name || id.replace(/_/g, " ");
  
  const formattedTime = lastUpdate 
    ? new Date(lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "";

  const currentEmoji = batteryLevel <= 20 ? "😴" : batteryLevel <= 50 ? "😐" : batteryLevel <= 80 ? "🙂" : "🤩";

  const handleSendEnergy = async () => {
    if (sent) return;
    setSent(true);

    // Feedback visual local (imediato)
    setTimeout(() => setSent(false), 3000);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // --- SALVA A NOTIFICAÇÃO NO FIREBASE ---
      await addDoc(collection(db, "notifications"), {
        to: id, // Manda para o ID do amigo (que é o nome dele no banco)
        from: currentUser.displayName || currentUser.email,
        fromPhoto: currentUser.photoURL,
        type: "energy", // Tipo da notificação
        read: false, // Começa como "não lida"
        createdAt: new Date().toISOString()
      });

      console.log(`Energia enviada para ${displayName}! ⚡`);

    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md hover:scale-[1.02]">
      <div className="flex items-center gap-4">
        
        {/* FOTO + BADGE */}
        <div className="relative">
          <div className={`w-14 h-14 rounded-full border-2 ${modeInfo.color.replace("text-", "border-")} p-0.5`}>
             {photo ? (
               <img src={photo} alt={displayName} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
             ) : (
               <div className={`w-full h-full rounded-full ${modeInfo.avatarBg} flex items-center justify-center text-slate-500 font-bold`}>
                 {displayName.charAt(0).toUpperCase()}
               </div>
             )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-slate-100 flex items-center justify-center w-7 h-7 text-sm">
            {currentEmoji}
          </div>
        </div>
        
        {/* INFO */}
        <div>
          <h3 className="font-bold text-slate-700 capitalize text-sm">
            {displayName}
          </h3>
          <p className="text-xs text-slate-400 font-medium flex gap-1 items-center">
            {modeInfo.mode}
            {formattedTime && <span className="opacity-50">• {formattedTime}</span>}
          </p>
        </div>
      </div>

      {/* BOTÃO RAIO */}
      <div className="text-right flex flex-col items-end gap-1">
        <span className={`text-lg font-bold ${modeInfo.color}`}>
          {batteryLevel}%
        </span>
        <button
          onClick={handleSendEnergy}
          disabled={sent}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
            ${sent ? "bg-green-100 text-green-600 scale-110" : "bg-slate-50 text-slate-400 hover:bg-yellow-50 hover:text-yellow-500 hover:scale-110 active:scale-90"}
          `}
        >
          {sent ? <Check size={16} /> : <Zap size={16} className={sent ? "" : "fill-current"} />}
        </button>
      </div>
    </div>
  );
}