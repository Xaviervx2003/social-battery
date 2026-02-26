import pandas as pd
import requests
import time
import re
import urllib3

# Silenciando os avisos
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

print("🔎 Iniciando Varredura de Risco: Buscando Capital Social e Idade das Empresas...")

try:
    # Lendo a nossa base de dinheiro
    df_dinheiro = pd.read_csv("base_fiscalizacao_am.csv")
    
    # Pegando os CNPJs únicos
    cnpjs_unicos = df_dinheiro['CNPJ_Vencedor'].dropna().unique()
    total = len(cnpjs_unicos)
    
    dados_empresas = []
    
    for index, cnpj_original in enumerate(cnpjs_unicos, start=1):
        cnpj_limpo = re.sub(r'[^0-9]', '', str(cnpj_original))
        url_api = f"https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}"
        
        print(f"[{index}/{total}] Analisando {cnpj_original}...", end=" ")
        
        # O nosso sistema de tentativas (Retry) para não ser bloqueado
        for tentativa in range(1, 4):
            try:
                resposta = requests.get(url_api, verify=False, timeout=10)
                if resposta.status_code == 200:
                    dados = resposta.json()
                    
                    dados_empresas.append({
                        'CNPJ_Vencedor': cnpj_original,
                        'Capital_Social': dados.get('capital_social', 0),
                        'Data_Abertura': dados.get('data_inicio_atividade', 'Desconhecida'),
                        'Atividade_Principal': dados.get('cnae_fiscal_descricao', 'Sem Ramo')
                    })
                    print("✅ Dados Financeiros Extraídos!")
                    break
                elif resposta.status_code == 429:
                    print("⏳ Pausa (429)...", end=" ")
                    time.sleep(10)
                else:
                    print("❌ Erro Receita.")
                    break
            except:
                print("⚠️ Falha.", end=" ")
                time.sleep(3)
                
        time.sleep(1.5) # Pausa de segurança

    # Transformando em tabela
    df_empresas = pd.DataFrame(dados_empresas)
    
    # Tratando o valor do Capital Social para ficar em reais
    df_empresas['Capital_Social'] = df_empresas['Capital_Social'].astype(float)
    
    # Cruzando com a base de licitações
    print("\n⚙️ Cruzando o Capital Social com os Valores dos Contratos...")
    
    # Somando quanto cada CNPJ ganhou no total
    df_dinheiro['Valor_Total_Item'] = df_dinheiro['Valor_Total_Item'].astype(str).str.replace(',', '.').astype(float)
    df_resumo_cnpj = df_dinheiro.groupby('CNPJ_Vencedor').agg(
        Total_Ganho_Governo=('Valor_Total_Item', 'sum')
    ).reset_index()
    
    # Fundindo tudo (Merge)
    df_final = pd.merge(df_empresas, df_resumo_cnpj, on='CNPJ_Vencedor', how='inner')
    
    # A MÁGICA: Calculando o Nível de Risco (Ganhou X vezes mais que o próprio capital)
    # Se o capital social for 0, colocamos 1 para não dar erro de divisão na matemática
    df_final['Multiplicador_Risco'] = df_final['Total_Ganho_Governo'] / df_final['Capital_Social'].replace(0, 1)
    
    # Ordenando pelos casos mais suspeitos (Quem tem multiplicador de risco mais alto)
    df_final = df_final.sort_values(by='Multiplicador_Risco', ascending=False)
    
    # Formatando para ficar bonito na tela
    df_final['Total_Ganho_Governo'] = df_final['Total_Ganho_Governo'].apply(lambda x: f"R$ {x:,.2f}")
    df_final['Capital_Social'] = df_final['Capital_Social'].apply(lambda x: f"R$ {x:,.2f}")
    df_final['Multiplicador_Risco'] = df_final['Multiplicador_Risco'].apply(lambda x: f"{x:,.1f}x o Capital")
    
    print("\n" + "="*80)
    print("🚨 ALERTA DE RED FLAGS: EMPRESAS COM CONTRATOS DESPROPORCIONAIS 🚨")
    print("="*80)
    
    colunas_mostrar = ['CNPJ_Vencedor', 'Data_Abertura', 'Capital_Social', 'Total_Ganho_Governo', 'Multiplicador_Risco']
    print(df_final[colunas_mostrar].head(10).to_string(index=False))
    
    df_final.to_csv("RELATORIO_RISCO_AM.csv", index=False, encoding='utf-8-sig')
    print("\n💾 Relatório de Risco salvo como 'RELATORIO_RISCO_AM.csv'")

except Exception as e:
    print(f"❌ Erro fatal: {e}")