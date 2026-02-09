import React from "react";
import { Battery, Clock, Flame, Trash2, Zap, Hash } from "lucide-react";
import { UserData } from "../../contexts/AuthContext";

export interface Friend extends UserData {
  requestId: string;
  streak: number;
  finalBattery: number;
  lastInteraction?: any;
}

interface FriendItemProps {
  friend: Friend;
  onRemove: (friend: Friend) => void;
  onMessage: (friend: Friend) => void;
}

export default function FriendItem({
  friend,
  onRemove,
  onMessage,
}: FriendItemProps) {
  const formatLastSeen = (timestamp: any) => {
    if (!timestamp) return "Off";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = (new Date().getTime() - date.getTime()) / 1000;
    if (diff < 60) return "Agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between transition-all active:scale-[0.98] relative overflow-hidden">
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
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                👤
              </div>
            )}
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${friend.finalBattery > 0 ? "bg-green-500" : "bg-slate-300"}`}
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
              className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full w-fit ${friend.finalBattery <= 20 ? "bg-red-100 text-red-600" : friend.finalBattery <= 50 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
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
          onClick={() => onRemove(friend)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={() => onMessage(friend)}
          className="bg-yellow-400 text-yellow-900 w-11 h-11 rounded-full flex items-center justify-center shadow-md shadow-yellow-200 hover:bg-yellow-300 active:scale-95 transition-all"
        >
          <Zap size={22} className="fill-current" />
        </button>
      </div>
    </div>
  );
}
