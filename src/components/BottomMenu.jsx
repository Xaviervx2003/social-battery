import React from "react";
import { Battery, MessageCircle, BarChart2, Bell } from "lucide-react";

export default function BottomMenu({ activeTab, setActiveTab, unreadCount }) {
  const NavButton = ({ icon: Icon, id }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`transition-all duration-300 ${activeTab === id ? "text-slate-900 scale-110" : "text-slate-400 hover:text-slate-600"}`}
    >
      <Icon size={24} fill={activeTab === id ? "currentColor" : "none"} />
    </button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-around z-20 border-t border-slate-100">
      <NavButton icon={Battery} id="home" />
      <NavButton icon={MessageCircle} id="friends" />
      <NavButton icon={BarChart2} id="insights" />
      <button
        onClick={() => setActiveTab("notifications")}
        className={`transition-all duration-300 relative ${activeTab === "notifications" ? "text-slate-900 scale-110" : "text-slate-400 hover:text-slate-600"}`}
      >
        <Bell
          size={24}
          fill={activeTab === "notifications" ? "currentColor" : "none"}
        />
        {unreadCount > 0 && activeTab !== "notifications" && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>
    </div>
  );
}
