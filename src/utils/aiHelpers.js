// src/utils/aiHelpers.js

// 1. NLP SIMPLES (Análise de Sentimento baseada em palavras-chave)
export const analyzeStatusSentiment = (text) => {
    if (!text) return null;
    const lower = text.toLowerCase();

    // Dicionário de Sentimentos
    const patterns = [
        { keywords: ['exausto', 'morta', 'morto', 'acabado', 'destruido', 'cansado', 'sono', 'zumbi'], level: 10, emoji: '💀' },
        { keywords: ['triste', 'chateado', 'depre', 'bad', 'sozinho', 'ignorado'], level: 20, emoji: '😢' },
        { keywords: ['estudando', 'prova', 'trabalho', 'reunião', 'focado', 'ocupado', 'café'], level: 30, emoji: '📚' },
        { keywords: ['academia', 'treino', 'gym', 'correr', 'crossfit'], level: 85, emoji: '💪' },
        { keywords: ['festa', 'rolê', 'beber', 'saindo', 'sextou', 'animado'], level: 100, emoji: '🎉' },
        { keywords: ['feliz', 'bem', 'tranquilo', 'paz', 'zen', 'de boa'], level: 75, emoji: '😌' }
    ];

    for (const p of patterns) {
        if (p.keywords.some(k => lower.includes(k))) {
            return { suggestedLevel: p.level, emoji: p.emoji };
        }
    }
    return null;
};

// 2. PREVISÃO DE BURNOUT (Análise de Padrões)
export const predictBurnout = (logs) => {
    if (!logs || logs.length < 5) return null; // Precisa de dados mínimos

    // Agrupar médias por dia da semana (0 = Domingo, 1 = Segunda...)
    const days = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    logs.forEach(log => {
        if (log.timestamp && log.timestamp.toDate) {
            const date = log.timestamp.toDate();
            const day = date.getDay(); // 0-6
            days[day].push(log.level);
        }
    });

    // Encontrar o pior dia
    let worstDay = null;
    let lowestAvg = 100;

    for (let i = 0; i <= 6; i++) {
        if (days[i].length > 0) {
            const sum = days[i].reduce((a, b) => a + b, 0);
            const avg = sum / days[i].length;
            if (avg < 35) { // Limite de alerta (Bateria vermelha/laranja)
                if (avg < lowestAvg) {
                    lowestAvg = avg;
                    worstDay = i;
                }
            }
        }
    }

    if (worstDay !== null) {
        return {
            day: dayNames[worstDay],
            avg: Math.round(lowestAvg),
            message: `Alerta: Suas terças-feiras costumam ser pesadas (${Math.round(lowestAvg)}%). Planeje um descanso!`
        };
    }
    return null;
};

// 3. SMART SORT (Score de Relevância)
export const calculateRelevanceScore = (friend) => {
    // Fator 1: Urgência (Bateria Baixa vale MAIS pontos de atenção)
    // Se bateria 10 -> score 90. Se bateria 100 -> score 0.
    const urgencyScore = 100 - (friend.finalBattery || 0);

    // Fator 2: Intimidade (Streak vale pontos multiplicados)
    const intimacyScore = (friend.streak || 0) * 10; 

    // Fator 3: Recência (Se interagiu nas últimas 24h, ganha bonus)
    // (Simplificado para este MVP apenas com streak e bateria)
    
    return urgencyScore + intimacyScore;
};