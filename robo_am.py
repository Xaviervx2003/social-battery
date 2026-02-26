import pandas as pd
import requests
import time
import re
import urllib3

# 🧹 Silenciando os avisos de segurança para deixar o terminal perfeitamente limpo
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

print("🕵️‍♂️ Iniciando o ARRASTÃO COMPLETO na Receita Federal (BrasilAPI)...")
print("🛡️ Sistema Anti-Bloqueio (Retry) ATIVADO!\n")

try:
    df_licitacoes = pd.read_csv("base_fiscalizacao_am.csv")
    
    # Pegando todos os CNPJs únicos da nossa base
    cnpjs_unicos = df_licitacoes['CNPJ_Vencedor'].dropna().unique()
    total_empresas = len(cnpjs_unicos)
    
    print(f"📊 Processando o QSA (Quadro de Sócios) de {total_empresas} empresas únicas...\n")
    
    dados_socios = []
    
    # Agora vamos rodar para TODOS os CNPJs da lista
    for index, cnpj_original in enumerate(cnpjs_unicos, start=1):
        cnpj_limpo = re.sub(r'[^0-9]', '', str(cnpj_original))
        url_api = f"https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}"
        
        print(f"[{index}/{total_empresas}] Consultando CNPJ: {cnpj_original}...", end=" ")
        
        # 🆕 NOVA FUNÇÃO: Sistema de Tentativas (Retry) para evitar o Erro 429
        max_tentativas = 3
        sucesso = False
        
        for tentativa in range(1, max_tentativas + 1):
            try:
                # Aumentei o timeout para 15 segundos para dar mais folga à rede
                resposta = requests.get(url_api, verify=False, timeout=15)
                
                if resposta.status_code == 200:
                    dados_empresa = resposta.json()
                    razao_social = dados_empresa.get("razao_social", "Nome não encontrado")
                    socios = dados_empresa.get("qsa", [])
                    
                    if len(socios) > 0:
                        print(f"✅ {len(socios)} sócio(s) encontrado(s)!")
                        for socio in socios:
                            dados_socios.append({
                                'CNPJ_Empresa': cnpj_original,
                                'Razao_Social': razao_social,
                                'Nome_do_Socio': socio.get("nome_socio"),
                                'Cargo_Qualificacao': socio.get("qualificacao_socio")
                            })
                    else:
                        print(f"⚠️ Sem sócios listados (S/A ou MEI).")
                    
                    sucesso = True
                    break # Sai do loop de tentativas porque deu certo!
                    
                elif resposta.status_code == 429:
                    # O servidor pediu para irmos mais devagar
                    print(f"\n   ⏳ Bloqueio 429. Pausando 10s (Tentativa {tentativa}/{max_tentativas})...", end=" ")
                    time.sleep(10) # Espera 10 segundos antes de rodar o 'for' de novo
                    
                else:
                    print(f"❌ Erro definitivo na Receita (Cód: {resposta.status_code}).")
                    break # Quebra o loop se for um erro diferente de 429 (ex: 404 CNPJ não existe)
                    
            except Exception as e_req:
                print(f"\n   ❌ Falha de conexão. Tentando novamente (Tentativa {tentativa}/{max_tentativas})...", end=" ")
                time.sleep(5)
                
        # Se tentou 3 vezes e não conseguiu, avisa
        if not sucesso and resposta.status_code == 429:
             print("❌ Empresa pulada devido a bloqueios sucessivos.")
            
        # ⏱️ Pausa padrão de 1.5 segundos entre empresas para não irritar o servidor
        time.sleep(1.5)
        
    # Consolidando tudo em um arquivo final
    df_socios = pd.DataFrame(dados_socios)
    
    print("\n" + "="*60)
    print("🎯 ARRASTÃO CONCLUÍDO COM SUCESSO E SEM FALHAS!")
    print(f"Foram mapeadas {len(df_socios)} conexões societárias no total.")
    print("="*60)
    
    df_socios.to_csv("socios_empresas_am_COMPLETO.csv", index=False, encoding='utf-8-sig')
    print("\n💾 Base de dados oficial salva como 'socios_empresas_am_COMPLETO.csv'")
    print("A estrutura de dados está pronta para cruzamentos financeiros ou para ser consumida por um aplicativo!")

except Exception as e:
    print(f"❌ Erro crítico na execução: {e}")