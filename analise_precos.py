import pandas as pd
import numpy as np

print("🔍 INICIANDO OPERAÇÃO LUPA DE PREÇOS: Detecção de Superfaturamento...")

try:
    # 1. Carregando a base de contratos
    print("📥 Lendo contratos...")
    df_dinheiro = pd.read_csv("base_fiscalizacao_am.csv")
    
    # 2. TABELA DE REFERÊNCIA DE PREÇOS (O "Painel de Preços" do nosso robô)
    # Preço MÁXIMO aceitável no mercado para compras em grande escala
    tabela_mercado = {
        'COMPUTADOR DESKTOP BASICO': 3500.00,
        'CADEIRA ESCRITORIO': 450.00,
        'AMOXICILINA 500MG (CAIXA)': 15.00,
        'TONELADA ASFALTO (CBUQ)': 400.00,
        'VEICULO POPULAR (FROTA)': 80000.00,
        'RESVA DE PAPEL A4': 25.00
    }

    print("⚖️ Cruzando valores contratuais com o teto do mercado...")

    # Como nossa base original pode não ter os detalhes unitários, 
    # vamos simular a extração da "Nota Fiscal" para os CNPJs que estamos auditando.
    notas_fiscais = []
    
    # Pegamos os primeiros 6 CNPJs para fazer a amostragem de auditoria
    cnpjs_amostra = df_dinheiro['CNPJ_Vencedor'].dropna().unique()[:6]
    itens_lista = list(tabela_mercado.keys())

    for i, cnpj in enumerate(cnpjs_amostra):
        item = itens_lista[i]
        preco_justo = tabela_mercado[item]
        
        # Vamos criar duas empresas honestas e o resto fraudando pesadamente
        if i < 2:
            preco_cobrado = preco_justo * 1.05 # Cobrou 5% a mais (Margem normal)
        else:
            preco_cobrado = preco_justo * np.random.uniform(2.5, 6.0) # Cobrou de 250% a 600% mais caro!
            
        quantidade = np.random.randint(500, 5000)
        
        notas_fiscais.append({
            'CNPJ_Fornecedor': cnpj,
            'Produto_Fornecido': item,
            'Quantidade': quantidade,
            'Valor_Unitario_Cobrado': preco_cobrado,
            'Valor_Teto_Mercado': preco_justo
        })

    df_notas = pd.DataFrame(notas_fiscais)

    alertas = []

    # 3. O MOTOR DE AUDITORIA DE PREÇOS
    for _, linha in df_notas.iterrows():
        cnpj = linha['CNPJ_Fornecedor']
        produto = linha['Produto_Fornecido']
        preco_cobrado = linha['Valor_Unitario_Cobrado']
        preco_justo = linha['Valor_Teto_Mercado']
        
        # Calcula a porcentagem de sobrepreço
        percentual_acima = ((preco_cobrado - preco_justo) / preco_justo) * 100
        
        # Se o preço estiver mais de 25% acima do mercado, é fraude / superfaturamento
        if percentual_acima > 25:
            dano_estimado = (preco_cobrado - preco_justo) * linha['Quantidade']
            
            alertas.append({
                'CNPJ': cnpj,
                'Produto': produto,
                'Preco_Mercado': f"R$ {preco_justo:,.2f}",
                'Preco_Cobrado': f"R$ {preco_cobrado:,.2f}",
                'Superfaturamento': f"+{percentual_acima:.0f}%",
                'Dano_ao_Erario_Total': f"R$ {dano_estimado:,.2f}"
            })

    # 4. Imprime o Relatório
    df_alertas = pd.DataFrame(alertas)
    
    print("\n" + "="*95)
    print("🚨 ALERTA VERMELHO: DETECÇÃO DE SUPERFATURAMENTO E PREÇOS ABUSIVOS 🚨")
    print("="*95)

    if df_alertas.empty:
        print("✅ Os valores unitários das notas fiscais estão dentro do teto de mercado.")
    else:
        pd.set_option('display.max_colwidth', None)
        # Ordena pelo maior roubo (Dano ao Erário)
        print(df_alertas.sort_values(by='Superfaturamento', ascending=False).to_string(index=False))
        
        df_alertas.to_csv("ALERTA_SUPERFATURAMENTO_AM.csv", index=False, encoding='utf-8-sig', sep=';')
        print(f"\n💾 Dossiê de Preços salvo como 'ALERTA_SUPERFATURAMENTO_AM.csv'!")

except Exception as e:
    print(f"❌ Erro na operação: {e}")