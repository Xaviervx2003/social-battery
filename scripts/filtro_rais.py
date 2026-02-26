import pandas as pd

print("🚜 INICIANDO MÁQUINA DE FILTRAGEM PESADA (RAIS - Região Norte)...")

# Coloque o nome exato do arquivo TXT que saiu do 7-Zip
arquivo_gigante = "RAIS_VINC_PUB_NORTE.txt" 
arquivo_am_limpo = "rais_amazonas_filtrada.csv"

# O código do IBGE para o estado do Amazonas é 13
codigo_uf_amazonas = 13 

# Vamos ler o arquivo em "pedaços" (chunks) de 100 mil linhas para não explodir a memória RAM do seu PC
tamanho_pedaco = 100000 
pedacos_amazonas = []

try:
    print("⏳ Lendo milhões de linhas... Isso pode demorar alguns minutos. Pegue um café!")
    
    # engine='c' deixa a leitura muito mais rápida, e o sep=';' é o padrão do governo
    for pedaco in pd.read_csv(arquivo_gigante, sep=';', encoding='latin1', chunksize=tamanho_pedaco, low_memory=False):
        
        # Filtra: Quero apenas as linhas onde a coluna 'UF' (ou 'Município' começando com 13) seja do Amazonas
        # Nota: Na RAIS, a coluna que diz o estado às vezes se chama 'UF', às vezes os 2 primeiros números de 'Município'
        if 'UF' in pedaco.columns:
            filtro = pedaco[pedaco['UF'] == codigo_uf_amazonas]
        else:
            # Se não tiver coluna UF, filtra pelos municípios que começam com 13 (ex: Manaus = 130260)
            filtro = pedaco[pedaco['Município'].astype(str).str.startswith('13')]
            
        pedacos_amazonas.append(filtro)
        print(f"✔️ Mais 100 mil linhas processadas...")

    # Junta todos os pedaços filtrados do Amazonas em uma tabela só
    df_amazonas = pd.concat(pedacos_amazonas)
    
    # Salva o arquivo final levinho só com a nossa base!
    df_amazonas.to_csv(arquivo_am_limpo, index=False, sep=';', encoding='utf-8-sig')
    
    print("\n" + "="*80)
    print(f"🎉 SUCESSO! O arquivo gigante foi reduzido apenas para o Amazonas.")
    print(f"Total de trabalhadores ativos encontrados no AM: {len(df_amazonas)} linhas.")
    print(f"Salvo como: {arquivo_am_limpo}")
    print("="*80)

except FileNotFoundError:
    print(f"❌ Erro: O arquivo {arquivo_gigante} não está na pasta. Baixe no FTP e extraia primeiro!")
except Exception as e:
    print(f"❌ Erro na leitura: {e}")