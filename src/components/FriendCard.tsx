import React, { useState } from "react";
import { Zap, Check } from "lucide-react";
import { getModeInfo } from "../utils/batteryHelpers";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// 1. Interface flexível para aceitar dados de diferentes lugares
export interface FriendCardData {
  // Campos esperados
  id?: string;
  uid?: string; // Fallback para id
  name?: string;
  displayName?: string; // Fallback para name
  photo?: string | null;
  photoURL?: string | null; // Fallback para photo
  batteryLevel?: number;
  currentBattery?: number; // Fallback para batteryLevel
  lastUpdate?: any;
  lastLogin?: any; // Fallback para lastUpdate
}

interface FriendCardProps {
  friend: FriendCardData;
}

export default function FriendCard({ friend }: FriendCardProps) {
  // 2. Normalização dos dados (Garante que funciona independente do nome do campo)
  const id = friend.id || friend.uid || "";
  const name = friend.name || friend.displayName || "Usuário";
  const photo = friend.photo || friend.photoURL || null;
  const batteryLevel = friend.batteryLevel ?? friend.currentBattery ?? 0;
  const lastUpdate = friend.lastUpdate || friend.lastLogin;

  const [sent, setSent] = useState(false);

  const modeInfo = getModeInfo(batteryLevel);
  // Remove underscores se houver (ex: Joao_Silva -> Joao Silva)
  const displayName = name.replace(/_/g, " ");

  // 3. Formatação segura da data (aceita Timestamp do Firebase ou Date string)
  const getFormattedTime = () => {
    if (!lastUpdate) return "";
    try {
      const date = lastUpdate.toDate
        ? lastUpdate.toDate()
        : new Date(lastUpdate);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  const formattedTime = getFormattedTime();

  const currentEmoji =
    batteryLevel <= 20
      ? "😴"
      : batteryLevel <= 50
        ? "😐"
        : batteryLevel <= 80
          ? "🙂"
          : "🤩";

  const handleSendEnergy = async () => {
    if (sent) return;
    setSent(true);

    // Feedback visual local (imediato)
    setTimeout(() => setSent(false), 3000);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !id) return;

      // --- SALVA A NOTIFICAÇÃO NO FIREBASE ---
      await addDoc(collection(db, "notifications"), {
        to: id,
        from: currentUser.uid,
        fromName: currentUser.displayName || currentUser.email,
        fromPhoto: currentUser.photoURL,
        type: "energy",
        message: "te mandou energia! ⚡", // Adicionei uma mensagem padrão
        read: false,
        timestamp: new Date(), // Usei timestamp para padronizar com o resto do app
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
          <div
            className={`w-14 h-14 rounded-full border-2 ${modeInfo.color.replace("text-", "border-")} p-0.5`}
          >
            {photo ? (
              <img
                src={photo}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={`w-full h-full rounded-full ${modeInfo.avatarBg} flex items-center justify-center text-slate-500 font-bold`}
              >
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
            {displayName.split(" ")[0]}{" "}
            {/* Mostra só o primeiro nome para caber melhor */}
          </h3>
          <p className="text-xs text-slate-400 font-medium flex gap-1 items-center">
            {modeInfo.mode}
            {formattedTime && (
              <span className="opacity-50">• {formattedTime}</span>
            )}
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
          {sent ? (
            <Check size={16} />
          ) : (
            <Zap size={16} className={sent ? "" : "fill-current"} />
          )}
        </button>
      </div>
    </div>
  );
}
