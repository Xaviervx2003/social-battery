import pandas as pd

print("☢️ LIGANDO O MÁQUINA DE RAIO-X NOS DADOS DO E-COMPRAS...")

try:
    # Lendo o arquivo que acabamos de baixar
    df_real = pd.read_csv("base_ecompras_am_2026.csv", sep=';', encoding='utf-8-sig')
    
    print("\n" + "="*60)
    print("1. QUAIS SÃO AS COLUNAS QUE O GOVERNO NOS MANDOU?")
    print("="*60)
    # Se o governo mandou a tabela sem nome nas colunas, o Pandas chama de 0, 1, 2, 3...
    colunas = list(df_real.columns)
    print(colunas)

    print("\n" + "="*60)
    print("2. COMO É O CONTEÚDO DA PRIMEIRA LICITAÇÃO?")
    print("="*60)
    
    # Vamos olhar a primeira linha inteira para ver se tem sujeira HTML (ex: <a href...>)
    primeira_linha = df_real.iloc[0]
    for nome_coluna, valor in primeira_linha.items():
        print(f"[{nome_coluna}] => {valor}")

except FileNotFoundError:
    print("❌ Arquivo não encontrado. Verifique se o nome está certo.")
except Exception as e:
    print(f"❌ Erro: {e}")