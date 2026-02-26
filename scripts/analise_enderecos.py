import pandas as pd
import requests
import time
import re
import urllib3

# Silenciando avisos de segurança
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

print("📍 Iniciando a Operação Cartel: Mapeando Endereços das Empresas...")

try:
    # Lendo a nossa base de dinheiro
    df_dinheiro = pd.read_csv("base_fiscalizacao_am.csv")
    cnpjs_unicos = df_dinheiro['CNPJ_Vencedor'].dropna().unique()
    total = len(cnpjs_unicos)

    dados_enderecos = []

    for index, cnpj_original in enumerate(cnpjs_unicos, start=1):
        cnpj_limpo = re.sub(r'[^0-9]', '', str(cnpj_original))
        url_api = f"https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}"

        print(f"[{index}/{total}] Rastreando endereço do CNPJ {cnpj_original}...", end=" ")

        # Sistema anti-bloqueio
        for tentativa in range(1, 4):
            try:
                resposta = requests.get(url_api, verify=False, timeout=10)
                if resposta.status_code == 200:
                    dados = resposta.json()
                    
                    razao_social = dados.get('razao_social', 'N/A')
                    cep = dados.get('cep', 'Sem CEP')
                    logradouro = dados.get('logradouro', 'Sem Rua')
                    numero = dados.get('numero', 'S/N')
                    
                    # Padronizando o texto do endereço para o computador conseguir comparar perfeitamente
                    endereco_completo = f"CEP: {cep} | {logradouro}, Num: {numero}".strip().upper()
                    
                    dados_enderecos.append({
                        'CNPJ_Vencedor': cnpj_original,
                        'Razao_Social': razao_social,
                        'Endereco_Completo': endereco_completo
                    })
                    print("✅ Endereço Capturado!")
                    break
                elif resposta.status_code == 429:
                    print("⏳ Pausa (429)...", end=" ")
                    time.sleep(10)
                else:
                    print("❌ Erro na Receita.")
                    break
            except:
                print("⚠️ Falha de conexão.", end=" ")
                time.sleep(3)

        time.sleep(1.5) # Respeitando o limite da API

    # Transformando em Tabela Pandas
    df_enderecos = pd.DataFrame(dados_enderecos)

    # A MÁGICA: Procurando endereços duplicados
    print("\n⚙️ Cruzando os dados espaciais (Buscando Salas e Prédios repetidos)...")
    
    # Agrupando pelo Endereço Completo
    df_agrupado = df_enderecos.groupby('Endereco_Completo').agg(
        Qtd_Empresas_No_Local=('CNPJ_Vencedor', 'count'),
        Empresas_Envolvidas=('Razao_Social', lambda x: ' + '.join(x)) # Junta o nome das empresas suspeitas
    ).reset_index()

    # O Filtro Fino: Mostra APENAS os endereços que abrigam MAIS DE 1 empresa
    df_suspeitos = df_agrupado[df_agrupado['Qtd_Empresas_No_Local'] > 1].sort_values(by='Qtd_Empresas_No_Local', ascending=False)

    print("\n" + "="*80)
    print("🚨 ALERTA DE CARTEL: EMPRESAS DIVIDINDO O MESMO ENDEREÇO FÍSICO 🚨")
    print("="*80)

    if df_suspeitos.empty:
        print("✅ Resultado limpo! Nenhuma empresa dividindo o mesmo endereço exato foi encontrada nesta amostra.")
    else:
        # Imprime as colunas formatadas na tela
        pd.set_option('display.max_colwidth', None) # Garante que o nome das empresas não seja cortado
        print(df_suspeitos[['Qtd_Empresas_No_Local', 'Endereco_Completo', 'Empresas_Envolvidas']].to_string(index=False))

    # Salva a prova do crime
    df_suspeitos.to_csv("ALERTA_ENDERECOS_AM.csv", index=False, encoding='utf-8-sig')
    print(f"\n💾 Relatório salvo na sua pasta como 'ALERTA_ENDERECOS_AM.csv'!")

except Exception as e:
    print(f"❌ Erro fatal no processamento: {e}")
    