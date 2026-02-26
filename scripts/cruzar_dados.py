import pandas as pd

print("⚙️ Iniciando a fusão das bases de dados (Dinheiro + Poder)...")

try:
    # 1. Carregando as nossas duas bases de dados limpas
    df_dinheiro = pd.read_csv("base_fiscalizacao_am.csv")
    df_socios = pd.read_csv("socios_empresas_am_COMPLETO.csv")

    # 2. Tratamento Contábil: Transformando o texto do valor (235971,9) em número real de computador (235971.9) para podermos somar
    df_dinheiro['Valor_Total_Item'] = df_dinheiro['Valor_Total_Item'].astype(str).str.replace(',', '.').astype(float)

    # 3. A GRANDE FUSÃO (Merge): Juntando as tabelas usando o CNPJ como "ponte"
    # Vamos renomear a coluna da base de sócios para o nome ficar igualzinho ao da base de dinheiro
    df_socios = df_socios.rename(columns={'CNPJ_Empresa': 'CNPJ_Vencedor'})
    df_cruzado = pd.merge(df_dinheiro, df_socios, on='CNPJ_Vencedor', how='inner')

    print("✅ Bases cruzadas com sucesso! Agrupando os valores por CPF/Sócio...")

    # 4. Agrupando e Somando: O algoritmo vai olhar nome por nome e somar os valores dos contratos
    df_ranking = df_cruzado.groupby('Nome_do_Socio').agg(
        Total_Arrecadado=('Valor_Total_Item', 'sum'),
        Qtd_Empresas=('Razao_Social', 'nunique'), # Conta quantas empresas diferentes o sócio usou
        Nomes_das_Empresas=('Razao_Social', lambda x: ' | '.join(x.unique()))
    ).reset_index()

    # 5. Organizando do maior para o menor (Ranking dos "Donos" do Estado)
    df_ranking = df_ranking.sort_values(by='Total_Arrecadado', ascending=False)

    # Formatando o número para ficar bonito em Reais (R$)
    df_ranking['Total_Arrecadado'] = df_ranking['Total_Arrecadado'].apply(lambda x: f"R$ {x:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'))

    print("\n" + "="*80)
    print("🏆 O PAINEL DA TRANSPARÊNCIA: TOP 10 SÓCIOS QUE MAIS RECEBERAM (2026)")
    print("="*80)
    
    # Mostrando apenas as colunas mais importantes no terminal, limitando aos 10 primeiros
    print(df_ranking[['Nome_do_Socio', 'Total_Arrecadado', 'Qtd_Empresas']].head(10).to_string(index=False))
    print("="*80)

    # 6. Salvando a Tabela Mestra Consolidada
    nome_arquivo = "RANKING_SOCIOS_AM_2026.csv"
    df_ranking.to_csv(nome_arquivo, index=False, encoding='utf-8-sig')
    
    print(f"\n💾 Relatório final e organizado salvo como '{nome_arquivo}' na sua pasta!")

except Exception as e:
    print(f"❌ Erro ao cruzar os dados: {e}")