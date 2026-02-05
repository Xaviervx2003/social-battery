# ⚡ Social Battery App

> Compartilhe sua energia social em tempo real com amigos próximos. Evite o burnout e melhore suas conexões.

![Social Battery Banner](https://via.placeholder.com/1200x400?text=Social+Battery+App+Banner)
_(Substitua este link por um print real do seu app depois!)_

## 📱 Sobre o Projeto

O **Social Battery** é uma aplicação PWA e Mobile (Android) que permite aos usuários gerenciar e compartilhar seu nível de "bateria social". Diferente de redes sociais tradicionais, o foco aqui não é o engajamento infinito, mas sim o **bem-estar digital**.

O app utiliza **Inteligência Artificial (NLP)** para analisar o status do usuário e sugerir níveis de bateria, além de prever padrões de cansaço (Burnout) com base no histórico.

## 🚀 Funcionalidades Principais

- **🔋 Slider de Bateria:** Controle visual e intuitivo do nível de energia (0-100%).
- **🏷️ Context Tags:** Indique o que está drenando ou carregando sua bateria (Trabalho, Família, Trânsito, etc.).
- **👻 Modo Fantasma:** Privacidade total quando você precisa desaparecer. O app "congela" seu status e para de sincronizar dados.
- **🤖 IA & Insights:**
  - Análise de sentimento do status digitado.
  - Alertas de burnout baseados em dias da semana.
- **⚡ Interações Rápidas:** Envie "energia" (raios) para amigos que estão com bateria baixa.
- **📱 Android Nativo:** Compilado com Capacitor para rodar como app nativo, com suporte a Widgets (em breve).

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Vite
- **Estilização:** TailwindCSS, Lucide React (Ícones)
- **Backend (BaaS):** Firebase (Firestore, Auth, Hosting)
- **Mobile:** CapacitorJS (Android)
- **IA/Lógica:** Algoritmos customizados de NLP e predição.

## 📦 Como Rodar Localmente

### Pré-requisitos

- Node.js instalado
- Conta no Firebase configurada

### Instalação

```bash
# 1. Clone o repositório
git clone [https://github.com/SEU_USUARIO/social-battery.git](https://github.com/SEU_USUARIO/social-battery.git)

# 2. Entre na pasta
cd social-battery

# 3. Instale as dependências
npm install

# 4. Configure o Firebase
# Crie um arquivo src/firebaseConfig.ts com suas credenciais

# 5. Rode o projeto Web
npm run dev
```
