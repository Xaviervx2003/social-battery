import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Inicializando a nossa API
app = FastAPI(
    title="API Fiscalização Amazonas",
    description="API para fornecer dados de licitações e sócios do AM",
    version="1.0"
)

# Configuração de CORS (Isso permite que um app em Flutter ou site React consiga puxar esses dados sem ser bloqueado)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite acesso de qualquer lugar
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def rota_principal():
    return {"mensagem": "Bem-vindo à API de Fiscalização do Amazonas! Acesse /ranking para ver os dados."}

@app.get("/ranking")
def obter_ranking():
    try:
        # A API vai ler aquele arquivo final que criamos no passo anterior
        df = pd.read_csv("RANKING_SOCIOS_AM_2026.csv")
        
        # O aplicativo precisa dos dados em JSON (Lista de Dicionários)
        dados_json = df.to_dict(orient="records")
        return dados_json
    except Exception as e:
        return {"erro": f"Não foi possível ler os dados. Detalhe: {e}"}

# Código para rodar o servidor
if __name__ == "__main__":
    print("🚀 Iniciando o servidor da API...")
    uvicorn.run(app, host="127.0.0.1", port=8000)