import pandas as pd
import requests
import time
import re
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

print("⚖️ INICIANDO OPERAÇÃO DAVI E GOLIAS: Cruzamento de Porte Tributário vs. Faturamento...")

try:
    # 1. Carrega os donos do dinheiro
    df_dinheiro = pd.read_csv("base_fiscalizacao_am.csv")
    
    # Agrupa o total ganho por CNPJ
    df_dinheiro['Valor_Numerico'] = df_dinheiro['Valor_Total_Item'].astype(str).str.replace('R$ ', '').str.replace('.', '').str.replace(',', '.').astype(float)
    df_agrupado = df_dinheiro.groupby('CNPJ_Vencedor')['Valor_Numerico'].sum().reset_index()

    cnpjs_unicos = df_agrupado['CNPJ_Vencedor'].unique()
    total = len(cnpjs_unicos)
    
    dados_empresas = []

    # 2. Bate na Receita Federal para descobrir o Porte (ME, EPP, DEMAIS)
    for index, cnpj_original in enumerate(cnpjs_unicos, start=1):
        cnpj_limpo = re.sub(r'[^0-9]', '', str(cnpj_original))
        valor_recebido = df_agrupado[df_agrupado['CNPJ_Vencedor'] == cnpj_original]['Valor_Numerico'].values[0]
        
        print(f"[{index}/{total}] Rastreando o porte tributário do CNPJ {cnpj_original}...", end=" ")

        url_api = f"https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}"
        
        for tentativa in range(3):
            try:
                resposta = requests.get(url_api, verify=False, timeout=10)
                if resposta.status_code == 200:
                    dados = resposta.json()
                    porte = str(dados.get('porte', 'NÃO INFORMADO')).upper()
                    
                    # 3. O MOTOR DE AUDITORIA TRIBUTÁRIA
                    risco = "✅ Normal"
                    
                    # Se for ME (Teto R$ 360 mil) mas ganhou mais de R$ 1 Milhão
                    if "MICRO EMPRESA" in porte and valor_recebido > 1000000:
                        risco = "🚨 ALERTA CRÍTICO: Microempresa (ME) recebendo contratos milionários!"
                    
                    # Se for EPP (Teto R$ 4.8 Milhões) mas ganhou mais de R$ 6 Milhões
                    elif "PEQUENO PORTE" in porte and valor_recebido > 6000000:
                        risco = "⚠️ ALERTA ALTO: EPP estourando o teto do Simples Nacional em licitação!"

                    # Só salva se tiver erro grave
                    if "Normal" not in risco:
                        dados_empresas.append({
                            'CNPJ_Suspeito': cnpj_original,
                            'Razao_Social': dados.get('razao_social', 'N/A'),
                            'Porte_Receita_Federal': porte,
                            'Total_Recebido_do_Estado': f"R$ {valor_recebido:,.2f}",
                            'Diagnostico_Tributario': risco
                        })
                    
                    print(f"Porte: {porte}")
                    break
                elif resposta.status_code == 429:
                    time.sleep(5)
            except:
                pass
        time.sleep(1) # Pausa amigável para não derrubar a API

    # 4. Imprime o Relatório
    df_alertas = pd.DataFrame(dados_empresas)
    
    print("\n" + "="*90)
    print("🚨 MALHA FINA TRIBUTÁRIA: EMPRESAS FATURANDO ACIMA DO ENQUADRAMENTO LEGAL 🚨")
    print("="*90)

    if df_alertas.empty:
        print("✅ Resultado limpo! Nenhuma ME ou EPP estourou os limites com esses contratos.")
    else:
        pd.set_option('display.max_colwidth', None)
        print(df_alertas.sort_values(by='Total_Recebido_do_Estado', ascending=False).to_string(index=False))
        df_alertas.to_csv("ALERTA_TRIBUTARIO_AM.csv", index=False, encoding='utf-8-sig', sep=';')
        print(f"\n💾 Dossiê tributário salvo como 'ALERTA_TRIBUTARIO_AM.csv'!")

except Exception as e:
    print(f"❌ Erro na operação: {e}")