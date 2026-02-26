import pandas as pd
import requests
import time
import re
import urllib3

# Desativa avisos chatos de segurança do servidor
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

print("🍞🏗️ INICIANDO OPERAÇÃO PADEIRO ENGENHEIRO: Checagem de CNAE e Desvio de Finalidade...")

try:
    # 1. Carregando a base de dinheiro
    print("📥 Lendo contratos do Estado...")
    df_dinheiro = pd.read_csv("base_fiscalizacao_am.csv")
    df_dinheiro['Valor_Numerico'] = df_dinheiro['Valor_Total_Item'].astype(str).str.replace('R$ ', '').str.replace('.', '').str.replace(',', '.').astype(float)
    df_agrupado = df_dinheiro.groupby('CNPJ_Vencedor')['Valor_Numerico'].sum().reset_index()

    cnpjs_unicos = df_agrupado['CNPJ_Vencedor'].unique()
    total = len(cnpjs_unicos)
    
    dados_cnae = []

    # Palavras-chave de atividades que raramente justificam contratos de dezenas de milhões sozinhas
    cnaes_suspeitos = [
        'VAREJISTA', 'FESTAS', 'EVENTOS', 'PADARIA', 'LANCHONETE', 'DOCES', 
        'BELEZA', 'CABELEIREIRO', 'ESTETICA', 'REPARACAO', 'LAVANDERIA', 'ARTESANATO'
    ]

    # 2. Bate na Receita Federal para descobrir o que a empresa realmente faz
    for index, cnpj_original in enumerate(cnpjs_unicos, start=1):
        cnpj_limpo = re.sub(r'[^0-9]', '', str(cnpj_original))
        valor_recebido = df_agrupado[df_agrupado['CNPJ_Vencedor'] == cnpj_original]['Valor_Numerico'].values[0]
        
        print(f"[{index}/{total}] Investigando a atividade principal do CNPJ {cnpj_original}...")

        url_api = f"https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}"
        
        for tentativa in range(3):
            try:
                resposta = requests.get(url_api, verify=False, timeout=10)
                if resposta.status_code == 200:
                    dados = resposta.json()
                    cnae = str(dados.get('cnae_fiscal_descricao', 'NÃO INFORMADO')).upper()
                    razao_social = dados.get('razao_social', 'N/A')
                    
                    # 3. O MOTOR DE AUDITORIA: Procurando o "Padeiro Engenheiro"
                    risco = "✅ Atividade Condizente"
                    
                    # Verifica se o CNAE tem palavras de varejo/serviço básico, mas a empresa faturou mais de 1 Milhão
                    if any(palavra in cnae for palavra in cnaes_suspeitos) and valor_recebido > 1000000:
                        risco = "🚨 ALERTA CRÍTICO: Atividade Varejista/Básica faturando milhões em Licitação!"
                    
                    # Salva todas as empresas para o dossiê, mas destaca as perigosas
                    dados_cnae.append({
                        'CNPJ': cnpj_original,
                        'Razao_Social': razao_social,
                        'CNAE_Registrado': cnae,
                        'Total_Recebido': f"R$ {valor_recebido:,.2f}",
                        'Nivel_de_Risco': risco
                    })
                    break
                
                elif resposta.status_code == 429: # Se a Receita pedir para ir devagar
                    time.sleep(3)
            except Exception as e:
                pass
                
        time.sleep(0.5) # Pausa tática para não bloquear o seu IP

    # 4. Imprime o Relatório
    df_alertas = pd.DataFrame(dados_cnae)
    
    print("\n" + "="*90)
    print("🚨 MALHA FINA DE ATIVIDADES: EMPRESAS COM CNAE SUSPEITO PARA O VALOR FATURADO 🚨")
    print("="*90)

    if df_alertas.empty:
        print("✅ Resultado limpo! Nenhuma empresa mapeada.")
    else:
        # Filtra para mostrar na tela preta apenas as que deram Alerta Crítico
        df_perigosos = df_alertas[df_alertas['Nivel_de_Risco'].str.contains('CRÍTICO')]
        
        pd.set_option('display.max_colwidth', None)
        if not df_perigosos.empty:
            print(df_perigosos.sort_values(by='Total_Recebido', ascending=False).to_string(index=False))
        else:
            print("✅ Todos os CNAEs parecem ser de construtoras, serviços pesados ou atacado.")
            
        # Mas salva TUDO no CSV para o nosso Dashboard usar
        df_alertas.to_csv("ALERTA_CNAE_AM.csv", index=False, encoding='utf-8-sig', sep=';')
        print(f"\n💾 Dossiê completo das atividades salvo como 'ALERTA_CNAE_AM.csv'!")

except Exception as e:
    print(f"❌ Erro na operação: {e}")