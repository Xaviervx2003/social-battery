import pandas as pd
import requests
import urllib3

# Desliga os avisos de segurança
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

print("🕷️ INICIANDO WEBSCRAPING AVANÇADO: Hackeando a API do DataTables...")

# A URL limpa, apenas o endereço do cofre
url_api = "https://www.e-compras.am.gov.br/publico/qry/qry_transparencia_licitacoes_todas.asp"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest' # Diz ao servidor: "Sou um script legítimo da própria página"
}

# O NOSSO PAYLOAD: As chaves para abrir o cofre de uma vez só!
payload = {
    'tipo': 'LICIT',
    'mudaAno': '2026',
    'draw': '1',
    'start': '0',       # Comece do item zero
    'length': '500'     # Traga 500 registros de uma vez (como só tem 140, vai vir tudo!)
}

try:
    print("📡 Enviando Payload com comandos de extração em massa (POST)...")
    
    # Fazemos um ataque de POST direto na API deles
    resposta = requests.post(url_api, data=payload, headers=headers, verify=False, timeout=20)
    
    if resposta.status_code == 200:
        # Pega a resposta de texto cru e transforma em um dicionário inteligente do Python
        dados_json = resposta.json()
        
        # Lembra do "data: []" vazio? Agora nós vamos ver se ele encheu!
        lista_licitacoes = dados_json.get("data", [])
        
        if len(lista_licitacoes) > 0:
            print(f"✅ O COFRE ABRIU! Recebemos {len(lista_licitacoes)} licitações recheadas de dados.")
            
            # O Pandas converte a lista do JSON direto para uma Tabela perfeita
            tabela = pd.DataFrame(lista_licitacoes)
            
            # Salva o arquivo CSV na sua máquina
            tabela.to_csv("base_ecompras_am_2026.csv", index=False, encoding='utf-8-sig', sep=';')
            print("\n💾 Base oficial salva com sucesso como 'base_ecompras_am_2026.csv'!")
            
            print("\n🔍 Espiada rápida na Linha 1:")
            # Mostra as primeiras colunas para a gente ver o que roubamos
            print(tabela.iloc[:, :4].head(1).to_string()) 
            
        else:
            print("❌ O servidor respondeu, mas a lista de dados ainda veio vazia. Eles podem ter mudado o sistema hoje.")
            
    else:
        print(f"❌ O servidor bloqueou o acesso. Código HTTP: {resposta.status_code}")

except Exception as e:
    print(f"❌ Erro Crítico: {e}")