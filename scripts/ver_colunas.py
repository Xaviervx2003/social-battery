import pandas as pd

print("🔎 Lendo o cabeçalho do banco de dados do Ministério do Trabalho...")

# Lemos apenas a linha 0 (só o cabeçalho) para ser instantâneo
df_rais = pd.read_csv("rais_amazonas_filtrada.csv", sep=';', encoding='utf-8-sig', nrows=0)

print("\n" + "="*50)
print("COLUNAS ENCONTRADAS NO ARQUIVO DO GOVERNO:")
print("="*50)

for coluna in df_rais.columns:
    print(f"- {coluna}")        