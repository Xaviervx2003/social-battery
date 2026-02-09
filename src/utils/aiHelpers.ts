// src/utils/aiHelpers.ts

// --- INTERFACES ---

interface SentimentResult {
  suggestedLevel: number;
  emoji: string;
}

interface BatteryLog {
  level: number;
  timestamp: any;
}

interface BurnoutPrediction {
  day: string;
  avg: number;
  message: string;
}

export interface FriendData {
  finalBattery?: number;
  streak?: number;
}

// 1. NLP SIMPLES (Análise de Sentimento)
export const analyzeStatusSentiment = (
  text: string,
): SentimentResult | null => {
  if (!text) return null;
  const lower = text.toLowerCase();

  const patterns = [
    {
      keywords: [
        "exausto",
        "morta",
        "morto",
        "acabado",
        "destruido",
        "cansado",
        "sono",
        "zumbi",
      ],
      level: 10,
      emoji: "💀",
    },
    {
      keywords: ["triste", "chateado", "depre", "bad", "sozinho", "ignorado"],
      level: 20,
      emoji: "😢",
    },
    {
      keywords: [
        "estudando",
        "prova",
        "trabalho",
        "reunião",
        "focado",
        "ocupado",
        "café",
      ],
      level: 30,
      emoji: "📚",
    },
    {
      keywords: ["feliz", "bem", "tranquilo", "paz", "zen", "de boa"],
      level: 75,
      emoji: "😌",
    },
    {
      keywords: ["academia", "treino", "gym", "correr", "crossfit"],
      level: 85,
      emoji: "💪",
    },
    {
      keywords: ["festa", "rolê", "beber", "saindo", "sextou", "animado"],
      level: 100,
      emoji: "🎉",
    },
  ];

  for (const p of patterns) {
    if (p.keywords.some((k) => lower.includes(k))) {
      return { suggestedLevel: p.level, emoji: p.emoji };
    }
  }
  return null;
};

// 2. PREVISÃO DE BURNOUT (Corrigida)
export const predictBurnout = (
  logs: BatteryLog[],
): BurnoutPrediction | null => {
  if (!logs || logs.length < 5) return null;

  const days: { [key: number]: number[] } = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };
  const dayNames = [
    "Domingos",
    "Segundas",
    "Terças",
    "Quartas",
    "Quintas",
    "Sextas",
    "Sábados",
  ];

  logs.forEach((log) => {
    if (log.timestamp) {
      const date = log.timestamp.toDate
        ? log.timestamp.toDate()
        : new Date(log.timestamp);
      days[date.getDay()].push(log.level);
    }
  });

  let worstDay: number | null = null;
  let lowestAvg = 100;

  for (let i = 0; i <= 6; i++) {
    if (days[i].length > 0) {
      const sum = days[i].reduce((a, b) => a + b, 0);
      const avg = sum / days[i].length;
      if (avg < 35 && avg < lowestAvg) {
        lowestAvg = avg;
        worstDay = i;
      }
    }
  }

  if (worstDay !== null) {
    return {
      day: dayNames[worstDay],
      avg: Math.round(lowestAvg),
      // 👇 CORREÇÃO: Agora usa o nome do dia dinamicamente
      message: `Alerta: Seus(uas) ${dayNames[worstDay]} costumam ser pesados(as) (${Math.round(lowestAvg)}%). Planeje um descanso!`,
    };
  }
  return null;
};

// 3. SMART SORT (Score de Relevância Ajustado)
export const calculateRelevanceScore = (friend: FriendData): number => {
  const battery = friend.finalBattery ?? 0;

  // Fator 1: Urgência (Quanto menor a bateria, mais pontos)
  // Ex: Bateria 10% -> 90 pontos | Bateria 100% -> 0 pontos
  const urgencyScore = 100 - battery;

  // Fator 2: Intimidade (Cada dia de streak vale 5 pontos extra)
  // Reduzi para 5 para equilibrar (10 era muito forte)
  const streak = friend.streak || 0;
  const intimacyScore = streak * 5;

  return urgencyScore + intimacyScore;
};
