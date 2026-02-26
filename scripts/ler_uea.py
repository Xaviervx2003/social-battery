import pandas as pd

print("🔎 Iniciando a leitura do banco de dados da UEA...")

nome_arquivo = "dados_uea.csv"

try:
    # Tentativa 1: Formato padrão (separado por vírgula e formato UTF-8)
    df_uea = pd.read_csv(nome_arquivo)
    print("✅ Sucesso na Tentativa 1 (Padrão Internacional)")
except:
    try:
        # Tentativa 2: Formato do Governo/Instituições BR (separado por ponto-e-vírgula e formato Latin1)
        df_uea = pd.read_csv(nome_arquivo, sep=';', encoding='latin1')
        print("✅ Sucesso na Tentativa 2 (Padrão Brasileiro)")
    except Exception as e:
        print(f"❌ Erro ao tentar ler o arquivo: {e}")
        exit()

# Mostra as colunas que ele encontrou e as 3 primeiras linhas de dados
print("\n" + "="*50)
print("COLUNAS ENCONTRADAS NESTE ARQUIVO:")
print("="*50)
for coluna in df_uea.columns:
    print(f"- {coluna}")

print("\n" + "="*50)
print("UMA AMOSTRA DOS DADOS (3 primeiras linhas):")
print("="*50)
print(df_uea.head(3).to_string())