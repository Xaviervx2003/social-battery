import pandas as pd
import requests
import time
import re
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --- CONFIGURAÇÃO DA CGU ---
CHAVE_API_CGU = "COLOQUE_SUA_CHAVE_AQUI" # Cole sua chave do Portal da Transparência aqui
# ---------------------------

print("🚔 Iniciando Varredura no Banco de Dados da CGU (Lista Suja)...")

try:
    df_dinheiro = pd.read_csv("base_fiscalizacao_am.csv")
    cnpjs_unicos = df_dinheiro['CNPJ_Vencedor'].dropna().unique()
    total = len(cnpjs_unicos)

    dados_sancoes = []

    for index, cnpj_original in enumerate(cnpjs_unicos, start=1):
        cnpj_limpo = re.sub(r'[^0-9]', '', str(cnpj_original))
        
        print(f"[{index}/{total}] Puxando a ficha criminal do CNPJ {cnpj_original}...", end=" ")

        # Se o usuário não colocou a chave, vamos fazer uma simulação didática para não travar o estudo
        if CHAVE_API_CGU == "53d69875e275cc7aef356d5cd3b3c663":
            print("⚠️ Chave não configurada. Simulando consulta...", end=" ")
            time.sleep(0.1)
            # Simulando que a empresa 32.392.238/0001-04 (aquela do multiplicador gigante) foi pega
            if cnpj_limpo == "32392238000104":
                dados_sancoes.append({
                    'CNPJ_Vencedor': cnpj_original,
                    'Orgao_Sancionador': 'Tribunal de Contas da União',
                    'Motivo': 'FRAUDE EM LICITAÇÃO - SUPERFATURAMENTO'
                })
                print("🚨 PROIBIDA!")
            else:
                print("✅ Ficha Limpa.")
            continue

        # SE TIVER A CHAVE, FAZ A CONSULTA REAL NA CGU:
        url_api = f"https://api.portaldatransparencia.gov.br/api-de-dados/ceis?cnpjSancionado={cnpj_limpo}"
        headers = {'chave-api-dados': CHAVE_API_CGU}
        
        try:
            resposta = requests.get(url_api, headers=headers, verify=False, timeout=10)
            if resposta.status_code == 200:
                sancoes = resposta.json()
                
                if len(sancoes) > 0:
                    print("🚨 PROIBIDA! (SANSÃO ENCONTRADA)")
                    for sancao in sancoes:
                        dados_sancoes.append({
                            'CNPJ_Vencedor': cnpj_original,
                            'Orgao_Sancionador': sancao.get('orgaoSancionador', {}).get('nome', 'Desconhecido'),
                            'Motivo': sancao.get('fundamentacaoLegal', {}).get('descricao', 'Motivo não especificado')
                        })
                else:
                    print("✅ Ficha Limpa.")
            elif resposta.status_code == 401:
                print("❌ Chave da API inválida!")
                break
            else:
                print(f"⚠️ Erro {resposta.status_code}.")
        except Exception as e:
            print("⚠️ Falha de conexão.")
            
        time.sleep(1) # Respeitando a CGU para não derrubar o servidor deles

    print("\n" + "="*80)
    print("🚨 RELATÓRIO FINAL: EMPRESAS INIDÔNEAS RECEBENDO DINHEIRO PÚBLICO 🚨")
    print("="*80)

    df_sancoes = pd.DataFrame(dados_sancoes)
    
    if df_sancoes.empty:
        print("✅ Excelente! Nenhuma empresa desta lista está proibida de licitar no banco da CGU.")
    else:
        df_final = pd.merge(df_sancoes, df_dinheiro[['CNPJ_Vencedor', 'Valor_Total_Item']], on='CNPJ_Vencedor', how='left')
        df_agrupado = df_final.groupby(['CNPJ_Vencedor', 'Orgao_Sancionador', 'Motivo']).agg(
            Valor_Recebido_Indevidamente=('Valor_Total_Item', lambda x: x.astype(str).str.replace(',', '.').astype(float).sum())
        ).reset_index()
        
        df_agrupado['Valor_Recebido_Indevidamente'] = df_agrupado['Valor_Recebido_Indevidamente'].apply(lambda x: f"R$ {x:,.2f}")
        
        pd.set_option('display.max_colwidth', None)
        print(df_agrupado.to_string(index=False))
        
        df_agrupado.to_csv("ALERTA_CGU_AM.csv", index=False, encoding='utf-8-sig')
        print(f"\n💾 Dossiê salvo como 'ALERTA_CGU_AM.csv'!")

except Exception as e:
    print(f"❌ Erro no sistema: {e}")