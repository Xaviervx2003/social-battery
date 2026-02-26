import pandas as pd
import re

print("👻 INICIANDO OPERAÇÃO FANTASMA REAL: Contratos vs. RAIS Amazonas...")

try:
    # 1. Carrega a base de dinheiro do Estado
    print("📥 Lendo os contratos da fiscalização...")
    df_dinheiro = pd.read_csv("base_fiscalizacao_am.csv")
    df_dinheiro['Valor_Numerico'] = df_dinheiro['Valor_Total_Item'].astype(str).str.replace('R$ ', '').str.replace('.', '').str.replace(',', '.').astype(float)
    df_agrupado = df_dinheiro.groupby('CNPJ_Vencedor')['Valor_Numerico'].sum().reset_index()

    # Tira os pontos e barras para o computador comparar só os números
    df_agrupado['CNPJ_Limpo'] = df_agrupado['CNPJ_Vencedor'].astype(str).apply(lambda x: re.sub(r'[^0-9]', '', x))

    # 2. Carrega a super base da RAIS que você acabou de gerar
    print("📥 Lendo o banco oficial do Ministério do Trabalho (828 mil registros)...")
    
    # Lemos tudo como texto (str) para não perder os zeros da frente do CNPJ
    df_rais = pd.read_csv("rais_amazonas_filtrada.csv", sep=';', encoding='utf-8-sig', dtype=str, on_bad_lines='skip')

    # A RAIS costuma chamar a coluna de CNPJ de várias formas dependendo do ano (ex: 'CNPJ / CEI', 'CNPJ_CEI', 'CNPJ Raíz')
    # O código abaixo descobre o nome certo automaticamente
    coluna_cnpj_rais = [col for col in df_rais.columns if 'CNPJ' in col.upper()][0]
    
    print("⚙️ Agrupando e contando a folha de pagamento de cada empresa...")
    
    # Preenche com zeros à esquerda para garantir os 14 dígitos normais de CNPJ
    df_rais['CNPJ_Limpo'] = df_rais[coluna_cnpj_rais].astype(str).apply(lambda x: re.sub(r'[^0-9]', '', x).zfill(14)) 
    
    # Conta quantas vezes o CNPJ aparece (cada vez é 1 funcionário)
    contagem_funcionarios = df_rais.groupby('CNPJ_Limpo').size().reset_index(name='Qtd_Funcionarios_CLT')

    # 3. O Cruzamento Definitivo
    print("⚔️ Cruzando os milhões faturados com as carteiras assinadas...")
    df_final = pd.merge(df_agrupado, contagem_funcionarios, on='CNPJ_Limpo', how='left')
    
    # O PULO DO GATO: Se o CNPJ não foi achado na RAIS, significa que ele tem ZERO funcionários no AM!
    df_final['Qtd_Funcionarios_CLT'] = df_final['Qtd_Funcionarios_CLT'].fillna(0).astype(int)

    alertas = []
    
    for _, linha in df_final.iterrows():
        cnpj = linha['CNPJ_Vencedor']
        valor = linha['Valor_Numerico']
        funcionarios = linha['Qtd_Funcionarios_CLT']
        
        if funcionarios == 0:
            risco = "🚨 CRÍTICO: ZERO FUNCIONÁRIOS (Empresa Fantasma / Laranja)"
        else:
            razao = valor / funcionarios
            if razao > 1000000: # Mais de 1 Milhão por funcionário contratado
                risco = f"⚠️ ALTO: R$ {razao:,.2f} recebidos para cada 1 funcionário!"
            else:
                risco = "✅ Normal"

        if "Normal" not in risco:
            alertas.append({
                'CNPJ_da_Empresa': cnpj,
                'Valor_Recebido_do_Estado': f"R$ {valor:,.2f}",
                'Quadro_de_Funcionarios': funcionarios,
                'Diagnostico_Auditoria': risco
            })

    # 4. Exibindo os Resultados
    df_alertas = pd.DataFrame(alertas)
    
    print("\n" + "="*90)
    print("🚨 ALERTA GERAL: EMPRESAS FANTASMAS OU COM QUADRO INCOMPATÍVEL 🚨")
    print("="*90)

    if df_alertas.empty:
        print("✅ Ficha limpa! Todas as empresas da amostra possuem funcionários declarados na RAIS.")
    else:
        pd.set_option('display.max_colwidth', None)
        print(df_alertas.sort_values(by='Quadro_de_Funcionarios').to_string(index=False))
        df_alertas.to_csv("ALERTA_FANTASMA_REAL_AM.csv", index=False, encoding='utf-8-sig', sep=';')
        print(f"\n💾 Provas salvas com sucesso como 'ALERTA_FANTASMA_REAL_AM.csv'")

except Exception as e:
    print(f"❌ Erro na operação: {e}")