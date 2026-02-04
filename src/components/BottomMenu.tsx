import React from "react";
import { Battery, Users, BarChart2, Bell, LucideIcon } from "lucide-react";

// 1. Tipagem das props do botão individual
interface NavButtonProps {
  icon: LucideIcon; // Tipo específico para ícones da Lucide
  id: string;
  activeTab: string;
  onClick: (id: string) => void;
  label: string;
  badgeCount?: number;
}

// Sub-componente extraído e tipado
const NavButton = ({ icon: Icon, id, activeTab, onClick, label, badgeCount }: NavButtonProps) => {
  const isActive = activeTab === id;

  return (
    <button
      onClick={() => onClick(id)}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className={`
        relative p-2 transition-all duration-300 ease-out
        ${isActive ? "text-slate-900 scale-110" : "text-slate-400 hover:text-slate-600"}
      `}
    >
      <Icon 
        size={24} 
        fill={isActive ? "currentColor" : "none"} 
        strokeWidth={isActive ? 2.5 : 2}
      />
      
      {/* Badge de Notificação (Bolinha vermelha) */}
      {(badgeCount || 0) > 0 && !isActive && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      )}
    </button>
  );
};

// 2. Tipagem das props do Menu Principal
interface BottomMenuProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
}

export default function BottomMenu({ activeTab, setActiveTab, unreadCount }: BottomMenuProps) {
  
  // Array de configuração
  const menuItems = [
    { id: "home", icon: Battery, label: "Minha Energia" },
    { id: "friends", icon: Users, label: "Amigos" },
    { id: "insights", icon: BarChart2, label: "Relatórios" },
    { id: "notifications", icon: Bell, label: "Notificações", badge: unreadCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex items-center justify-around z-20 border-t border-slate-100 safe-area-bottom">
      {menuItems.map((item) => (
        <NavButton
          key={item.id}
          id={item.id}
          icon={item.icon}
          label={item.label}
          activeTab={activeTab}
          onClick={setActiveTab}
          badgeCount={item.badge}
        />
      ))}
    </nav>
  );
}