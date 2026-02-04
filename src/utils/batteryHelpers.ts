import { Moon, MessageCircle, Coffee, Zap, LucideIcon } from "lucide-react";

// 1. Definimos o "formato" do objeto que essa função retorna
export interface BatteryMode {
  mode: string;
  color: string;
  textColor: string;
  accent: string;
  icon: LucideIcon; // Tipo específico para ícones da Lucide
  desc: string;
  avatarBg: string;
}

// 2. Tipamos a entrada (level é número) e a saída (retorna um BatteryMode)
export const getModeInfo = (level: number): BatteryMode => {
  if (level <= 20)
    return {
      mode: "Modo Caverna",
      color: "bg-slate-800",
      textColor: "text-slate-200",
      accent: "from-slate-700 to-slate-900",
      icon: Moon,
      desc: "Sem respostas. Apenas existindo.",
      avatarBg: "bg-slate-700",
    };
  if (level <= 50)
    return {
      mode: "Modo Passivo",
      color: "bg-blue-600",
      textColor: "text-blue-50",
      accent: "from-blue-500 to-blue-700",
      icon: MessageCircle,
      desc: "Memes e textos. Sem ligações.",
      avatarBg: "bg-blue-500",
    };
  if (level <= 80)
    return {
      mode: "Modo Café",
      color: "bg-orange-500",
      textColor: "text-orange-50",
      accent: "from-orange-400 to-orange-600",
      icon: Coffee,
      desc: "Topo sair para algo tranquilo.",
      avatarBg: "bg-orange-400",
    };
  return {
    mode: "Modo Festa",
    color: "bg-green-500",
    textColor: "text-green-50",
    accent: "from-green-400 to-green-600",
    icon: Zap,
    desc: "Pronto para o agito total!",
    avatarBg: "bg-green-400",
  };
};