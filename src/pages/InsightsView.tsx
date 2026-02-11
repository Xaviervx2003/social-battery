import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Activity,
  RefreshCw,
  Sparkles,
  Brain,
  AlertTriangle,
} from "lucide-react";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { predictBurnout } from "../utils/aiHelpers";
import { UserData } from "../contexts/AuthContext";

// --- INTERFACES ---
interface InsightsViewProps {
  currentUser: UserData | null;
}

interface ChartData {
  fullLabel: string;
  shortLabel: string;
  level: number;
  timestamp: any; // Pode vir como String do cache ou Timestamp do Firebase
  rawDate: string; // Salvamos como string ISO para o cache não quebrar
}

interface MoodDataItem {
  name: string;
  value: number;
}

interface Stats {
  avg: number;
  max: number;
  min: number;
}

interface VibeAnalysis {
  text: string;
  color: string;
}

interface BurnoutPrediction {
  day: string;
  avg: number;
  message: string;
}

export default function InsightsView({ currentUser }: InsightsViewProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [moodData, setMoodData] = useState<MoodDataItem[]>([]);
  const [stats, setStats] = useState<Stats>({ avg: 0, max: 0, min: 0 });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");
  const [vibeAnalysis, setVibeAnalysis] = useState<VibeAnalysis>({
    text: "Carregando...",
    color: "text-slate-400",
  });
  const [burnoutAlert, setBurnoutAlert] = useState<BurnoutPrediction | null>(
    null,
  );

  const userId = currentUser?.uid;
  const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#8b5cf6"];
  const CACHE_KEY = `battery_history_${userId}_${timeRange}`; // Chave única por usuário e filtro

  // --- FUNÇÕES AUXILIARES ---

  const analyzeVibe = (avg: number): VibeAnalysis => {
    if (avg === 0)
      return { text: "Sem dados. Você existe? 👻", color: "text-slate-400" };
    if (avg < 20)
      return {
        text: "Modo Zumbi Ativado 🧟‍♂️ Vai dormir!",
        color: "text-red-500",
      };
    if (avg < 40)
      return { text: "Bateria Social de NPC 😐", color: "text-orange-500" };
    if (avg < 60)
      return {
        text: "Na média, vivendo perigosamente 🤷",
        color: "text-yellow-600",
      };
    if (avg < 85)
      return { text: "Energia de Protagonista ✨", color: "text-indigo-600" };
    return {
      text: "Deus da Energia?! ⚡ Tu é máquina!",
      color: "text-green-600",
    };
  };

  const processData = (rawData: ChartData[]) => {
    let total = 0;
    let max = 0;
    let min = 100;
    let moods = { Esgotado: 0, Baixo: 0, Bem: 0, Super: 0 };

    rawData.forEach((item) => {
      total += item.level;
      if (item.level > max) max = item.level;
      if (item.level < min) min = item.level;

      if (item.level <= 20) moods.Esgotado++;
      else if (item.level <= 50) moods.Baixo++;
      else if (item.level <= 80) moods.Bem++;
      else moods.Super++;
    });

    // Atualiza Gráficos
    setData(rawData);

    // Atualiza Pizza
    const pieData: MoodDataItem[] = [
      { name: "💀 Morto", value: moods.Esgotado },
      { name: "😐 Meh", value: moods.Baixo },
      { name: "🙂 Suave", value: moods.Bem },
      { name: "🤩 Hype", value: moods.Super },
    ].filter((item) => item.value > 0);
    setMoodData(pieData);

    // Atualiza AI Burnout
    // Convertemos de volta para Date para a IA entender os dias da semana
    const dataForAI = rawData.map((d) => ({
      level: d.level,
      timestamp: new Date(d.rawDate),
    }));
    setBurnoutAlert(predictBurnout(dataForAI));

    // Atualiza Stats
    if (rawData.length > 0) {
      const calculatedAvg = Math.round(total / rawData.length);
      setStats({ avg: calculatedAvg, max, min });
      setVibeAnalysis(analyzeVibe(calculatedAvg));
    } else {
      setStats({ avg: 0, max: 0, min: 0 });
      setVibeAnalysis(analyzeVibe(0));
    }
  };

  const fetchHistory = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. TENTA CARREGAR DO CACHE PRIMEIRO (OFFLINE FIRST)
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      console.log("Carregando do Cache Local...");
      try {
        const parsedData = JSON.parse(cached);
        processData(parsedData); // Mostra dados antigos na hora!
      } catch (e) {
        console.error("Erro ao ler cache", e);
      }
    }

    // 2. BUSCA DADOS FRESCOS NO FIREBASE
    try {
      const now = new Date();
      let startDate = new Date();

      if (timeRange === "day") {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeRange === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === "month") {
        startDate.setDate(now.getDate() - 30);
      }

      const q = query(
        collection(db, "battery_logs"),
        where("uid", "==", userId),
        where("timestamp", ">=", startDate),
        orderBy("timestamp", "asc"),
      );

      const querySnapshot = await getDocs(q);
      const historyData: ChartData[] = [];

      querySnapshot.forEach((doc) => {
        const item = doc.data();
        if (!item.timestamp) return;

        const date = item.timestamp.toDate
          ? item.timestamp.toDate()
          : new Date(item.timestamp);

        let label = "";
        if (timeRange === "day") {
          label = date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          });
        } else {
          label = date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          });
        }

        historyData.push({
          fullLabel: date.toLocaleString("pt-BR"),
          shortLabel: label,
          level: item.level,
          timestamp: date, // Objeto Date para uso interno
          rawDate: date.toISOString(), // String ISO para salvar no JSON
        });
      });

      // Se achou dados novos, atualiza a tela E o cache
      if (historyData.length > 0) {
        processData(historyData);
        // Salva no Cache Local
        localStorage.setItem(CACHE_KEY, JSON.stringify(historyData));
      } else if (!cached) {
        // Se não tem dados nem cache, limpa tudo
        setData([]);
      }
    } catch (error: any) {
      console.error("Erro ao buscar histórico:", error);
      // 🔥 DICA DE OURO: Verifica se é erro de Índice
      if (
        error.code === "failed-precondition" ||
        error.message?.includes("index")
      ) {
        console.log(
          "⚠️ FALTANDO ÍNDICE NO FIREBASE! OLHE O CONSOLE DO NAVEGADOR PARA O LINK.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId, timeRange]);

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <header className="px-2">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              Insights{" "}
              <Sparkles size={18} className="text-yellow-500 fill-yellow-500" />
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              Sua capivara energética 📊
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="p-2 bg-white border border-slate-100 shadow-sm rounded-full hover:bg-slate-50 transition-colors active:scale-95"
          >
            <RefreshCw
              size={18}
              className={
                loading ? "animate-spin text-indigo-600" : "text-slate-600"
              }
            />
          </button>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-inner">
          {[
            { id: "day", label: "Hoje" },
            { id: "week", label: "7 Dias" },
            { id: "month", label: "Mês" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id as "day" | "week" | "month")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                timeRange === t.id
                  ? "bg-white text-indigo-600 shadow-sm scale-[1.02]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* --- ALERTA DE BURNOUT --- */}
      {burnoutAlert && (
        <div className="mx-2 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 animate-pulse shadow-sm">
          <div className="bg-red-100 p-2 rounded-full text-red-500 mt-1">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="text-red-700 font-bold text-sm flex items-center gap-2">
              Padrão de Esgotamento
            </h4>
            <p className="text-red-600 text-xs mt-1 leading-relaxed font-medium">
              {burnoutAlert.message}
            </p>
          </div>
        </div>
      )}

      {/* VIBE CHECK */}
      <div className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm shadow-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Vibe Check
            </h3>
            <p
              className={`text-lg font-bold leading-tight ${vibeAnalysis.color}`}
            >
              "{vibeAnalysis.text}"
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
          <span className="text-2xl font-black text-indigo-600">
            {stats.avg}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <Activity size={10} /> Média
          </span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
          <span className="text-2xl font-black text-emerald-500">
            {stats.max}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <TrendingUp size={10} /> Pico
          </span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
          <span className="text-2xl font-black text-rose-500">
            {stats.min}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <TrendingDown size={10} /> Baixa
          </span>
        </div>
      </div>

      {/* GRÁFICO PRINCIPAL */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 text-sm">
          <Zap size={16} className="text-yellow-500 fill-yellow-500" />
          {timeRange === "day" ? "Oscilação do Dia" : "Histórico de Energia"}
        </h3>
        <div style={{ width: "100%", height: 200 }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                  interval="preserveStartEnd"
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#475569",
                  }}
                  cursor={{
                    stroke: "#6366f1",
                    strokeWidth: 2,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="monotoneX"
                  dataKey="level"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorLevel)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
              <Activity size={32} className="mb-2" />
              <p className="text-xs text-center px-8">
                Mexe na bateria algumas vezes para gerar histórico!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PIZZA */}
      {moodData.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="w-1/2 relative h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={6}
                  dataKey="value"
                  cornerRadius={6}
                >
                  {moodData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="none"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 pl-2 space-y-2">
            <h4 className="font-bold text-slate-700 text-xs mb-2 uppercase tracking-wide">
              Distribuição
            </h4>
            {moodData.map((entry, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-slate-500 font-medium"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
