import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, YAxis, CartesianGrid 
} from 'recharts';
import { TrendingUp, TrendingDown, Zap, Activity, RefreshCw } from "lucide-react";
import { db } from "../firebaseConfig";
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export default function InsightsView({ currentUser }) {
  const [data, setData] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [stats, setStats] = useState({ avg: 0, max: 0, min: 0 });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month'

  // Identificação do Usuário (aceita tanto objeto user quanto uid direto)
  const userId = currentUser?.uid || currentUser?.id;
  
  // Cores do Gráfico
  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#6366f1'];

  const fetchHistory = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();

      if (timeRange === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setDate(now.getDate() - 30);
      }

      const q = query(
        collection(db, "battery_logs"),
        where("uid", "==", userId),
        where("timestamp", ">=", startDate),
        orderBy("timestamp", "asc")
      );

      const querySnapshot = await getDocs(q);
      const historyData = [];
      
      let total = 0;
      let max = 0;
      let min = 100;
      let moods = { Esgotado: 0, Baixo: 0, Bem: 0, Super: 0 };

      querySnapshot.forEach((doc) => {
        const item = doc.data();
        // Proteção contra datas inválidas
        if (!item.timestamp) return;

        const date = item.timestamp.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
        
        let label = "";
        if (timeRange === 'day') {
            label = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else {
            label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }

        historyData.push({
          fullLabel: date.toLocaleString('pt-BR'),
          shortLabel: label,
          level: item.level
        });

        total += item.level;
        if (item.level > max) max = item.level;
        if (item.level < min) min = item.level;

        if (item.level <= 20) moods.Esgotado++;
        else if (item.level <= 50) moods.Baixo++;
        else if (item.level <= 80) moods.Bem++;
        else moods.Super++;
      });

      setData(historyData);

      const pieData = [
        { name: 'Esgotado', value: moods.Esgotado },
        { name: 'Baixo', value: moods.Baixo },
        { name: 'Bem', value: moods.Bem },
        { name: 'Super', value: moods.Super },
      ].filter(item => item.value > 0);
      
      setMoodData(pieData);

      if (historyData.length > 0) {
        setStats({
          avg: Math.round(total / historyData.length),
          max: max,
          min: min
        });
      } else {
        setStats({ avg: 0, max: 0, min: 0 });
      }

    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
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
                <h1 className="text-2xl font-bold text-slate-800">Seus Insights</h1>
                <p className="text-slate-500 text-sm">Análise Temporal</p>
            </div>
            <button onClick={fetchHistory} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <RefreshCw size={18} className={loading ? "animate-spin text-indigo-600" : "text-slate-600"} />
            </button>
        </div>

        {/* SELETOR DE TEMPO */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            {['day', 'week', 'month'].map((range) => (
                <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        timeRange === range 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    {range === 'day' && 'Hoje'}
                    {range === 'week' && '7 Dias'}
                    {range === 'month' && '30 Dias'}
                </button>
            ))}
        </div>
      </header>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-200 flex flex-col items-center justify-center">
          <Activity size={20} className="mb-1 opacity-80" />
          <span className="text-2xl font-bold">{stats.avg}%</span>
          <span className="text-[10px] opacity-70 uppercase">Média</span>
        </div>
        <div className="bg-emerald-500 rounded-2xl p-4 text-white shadow-lg shadow-emerald-200 flex flex-col items-center justify-center">
          <TrendingUp size={20} className="mb-1 opacity-80" />
          <span className="text-2xl font-bold">{stats.max}%</span>
          <span className="text-[10px] opacity-70 uppercase">Pico</span>
        </div>
        <div className="bg-rose-500 rounded-2xl p-4 text-white shadow-lg shadow-rose-200 flex flex-col items-center justify-center">
          <TrendingDown size={20} className="mb-1 opacity-80" />
          <span className="text-2xl font-bold">{stats.min}%</span>
          <span className="text-[10px] opacity-70 uppercase">Baixa</span>
        </div>
      </div>

      {/* GRÁFICO DE ÁREA (Principal) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm">
          <Zap size={16} className="text-indigo-500"/>
          {timeRange === 'day' ? 'Variação Horária' : 'Tendência'}
        </h3>
        
        {/* CORREÇÃO DO ERRO DE WIDTH/HEIGHT */}
        {/* O container precisa ter tamanho explícito antes do gráfico carregar */}
        <div style={{ width: '100%', height: 200, minWidth: 0 }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="shortLabel" 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                  axisLine={false} 
                  tickLine={false}
                  minTickGap={20}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                  cursor={{stroke: '#6366f1', strokeWidth: 1}}
                />
                <Area 
                  type="monotone" 
                  dataKey="level" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLevel)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-300 text-xs text-center px-8">
                {timeRange === 'day' 
                    ? "Nenhum registro hoje. Mude sua bateria na Home para começar!" 
                    : "Sem histórico nesse período."}
            </div>
          )}
        </div>
      </div>

      {/* GRÁFICO DE PIZZA (Secundário) */}
      {moodData.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
           
           <div style={{ width: 120, height: 120, position: 'relative' }}>
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {moodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <span className="text-xs font-bold text-slate-400">Vibe</span>
             </div>
           </div>
           
           <div className="w-1/2 pl-4 space-y-2">
             <h4 className="font-bold text-slate-700 text-sm mb-2">Resumo</h4>
             {moodData.map((entry, index) => (
               <div key={index} className="flex items-center gap-2 text-xs text-slate-500">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                 <span>{entry.name}</span>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}