import pandas as pd
import os

print("👁️ INICIANDO O OLHO DE SAURON: Cruzamento Relacional de Múltiplas Bases...")

try:
    # 1. Carrega a Base Central (O coração financeiro de 2026)
    print("📥 Lendo contratos reais do E-Compras (2026)...")
    df_contratos = pd.read_csv("base_fiscalizacao_am.csv", sep=',')
    
    # Agrupa para saber quanto CADA empresa ganhou no total nesse ano
    df_agrupado = df_contratos.groupby(['CNPJ_Vencedor', 'Nome_da_Empresa'])['Valor_Total_Item'].sum().reset_index()
    df_agrupado = df_agrupado.rename(columns={'Valor_Total_Item': 'Total_Ganho_2026'})
    
    print(f"📊 Encontradas {len(df_agrupado)} empresas diferentes ganhando contratos.")

    # 2. Preparando as listas de Alertas (Dossiês que já criamos)
    # Usamos dicionários para o computador buscar na velocidade da luz
    alerta_cgu = {}
    alerta_cnae = {}
    alerta_tributario = {}

    # Lendo CGU (Lista Suja)
    if os.path.exists("ALERTA_CGU_AM.csv"):
        df_cgu = pd.read_csv("ALERTA_CGU_AM.csv", sep=',')
        for _, row in df_cgu.iterrows():
            alerta_cgu[row['CNPJ_Vencedor']] = row['Motivo']

    # Lendo CNAE (Padeiro Engenheiro)
    if os.path.exists("ALERTA_CNAE_AM.csv"):
        df_cnae = pd.read_csv("ALERTA_CNAE_AM.csv", sep=';')
        for _, row in df_cnae.iterrows():
            if 'CRÍTICO' in str(row['Nivel_de_Risco']):
                alerta_cnae[row['CNPJ']] = row['CNAE_Registrado']

    # Lendo Tributário (Davi e Golias - Porte da Empresa)
    if os.path.exists("ALERTA_TRIBUTARIO_AM.csv"):
        df_trib = pd.read_csv("ALERTA_TRIBUTARIO_AM.csv", sep=';')
        for _, row in df_trib.iterrows():
            alerta_tributario[row['CNPJ_Suspeito']] = row['Diagnostico_Tributario']

    # 3. O CRUZAMENTO (INNER/LEFT JOIN LÓGICO)
    print("⚙️ Cruzando CNPJs com bases de inteligência...")
    
    relatorio_final = []

    for _, empresa in df_agrupado.iterrows():
        cnpj = empresa['CNPJ_Vencedor']
        nome = empresa['Nome_da_Empresa']
        valor = empresa['Total_Ganho_2026']
        
        flags = []
        nivel_risco = "🟢 Limpo"

        # Verifica na CGU
        if cnpj in alerta_cgu:
            flags.append(f"PROIBIDA (CGU): {alerta_cgu[cnpj]}")
            nivel_risco = "🔴 RISCO MÁXIMO"
            
        # Verifica CNAE
        if cnpj in alerta_cnae:
            flags.append(f"CNAE SUSPEITO: {alerta_cnae[cnpj]}")
            if nivel_risco != "🔴 RISCO MÁXIMO": nivel_risco = "🟠 RISCO ALTO"
            
        # Verifica Tributário
        if cnpj in alerta_tributario:
            flags.append(alerta_tributario[cnpj])
            if nivel_risco == "🟢 Limpo": nivel_risco = "🟡 ATENÇÃO"

        # Se a empresa tem alguma bandeira vermelha, entra no relatório
        if flags:
            relatorio_final.append({
                'CNPJ': cnpj,
                'Empresa': nome,
                'Faturamento_2026': f"R$ {valor:,.2f}",
                'Nivel': nivel_risco,
                'Detalhes_Ocultos': " | ".join(flags)
            })

    # 4. Exibição da Matriz de Risco
    print("\n" + "="*110)
    print("🚨 MATRIZ DE RISCO INTEGRADA: EMPRESAS SUSPEITAS COM CONTRATOS ATIVOS EM 2026 🚨")
    print("="*110)

    df_relatorio = pd.DataFrame(relatorio_final)

    if df_relatorio.empty:
        print("✅ Ficha Limpa! Nenhuma das empresas que ganharam contratos recentemente possui pendências nos nossos dossiês.")
    else:
        pd.set_option('display.max_colwidth', None)
        df_ordenado = df_relatorio.sort_values(by='Nivel')
        print(df_ordenado.to_string(index=False))
        
        df_ordenado.to_csv("DOSSIE_INTEGRADO_2026.csv", index=False, encoding='utf-8-sig', sep=';')
        print(f"\n💾 Dossiê Integrado salvo como 'DOSSIE_INTEGRADO_2026.csv'!")

except Exception as e:
    print(f"❌ Erro Crítico: {e}")