import React from "react";
import { BarChart3, TrendingUp, Zap } from "lucide-react";

export default function InsightsView() {
  // Mock de dados (Simulando uma semana de bateria)
  const weeklyData = [40, 70, 90, 20, 60, 80, 50];

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <header className="px-2">
        <h1 className="text-2xl font-bold text-slate-800">Seus Insights</h1>
        <p className="text-slate-500 text-sm">Análise da sua energia social</p>
      </header>

      {/* Card de Média Semanal */}
      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-white/20 p-2 rounded-xl">
            <TrendingUp size={24} className="text-white" />
          </div>
          <span className="text-xs font-medium bg-indigo-500 px-2 py-1 rounded-full border border-indigo-400">
            Semanal
          </span>
        </div>
        <div>
          <h2 className="text-4xl font-bold mb-1">64%</h2>
          <p className="text-indigo-100 text-sm">Sua média de energia esta semana</p>
        </div>
      </div>

      {/* Gráfico CSS Simples (Sem biblioteca pesada) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
          <BarChart3 size={18} className="text-slate-400"/> Variação Diária
        </h3>
        
        <div className="flex items-end justify-between h-32 gap-2">
          {weeklyData.map((level, index) => (
            <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
              <div 
                className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden transition-all duration-500 hover:bg-indigo-100"
                style={{ height: '100%' }}
              >
                <div 
                  className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-1000 ${
                    level > 50 ? 'bg-green-400' : 'bg-amber-400'
                  }`}
                  style={{ height: `${level}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dica do Dia */}
      <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex gap-4 items-start">
        <div className="bg-orange-100 p-2 rounded-full text-orange-600 mt-1">
          <Zap size={18} />
        </div>
        <div>
          <h4 className="font-bold text-orange-800 text-sm">Dica de Recarga</h4>
          <p className="text-orange-700/80 text-xs mt-1 leading-relaxed">
            Sua bateria costuma cair nas quartas-feiras. Que tal bloquear sua agenda hoje à noite para ler um livro?
          </p>
        </div>
      </div>
    </div>
  );
}