import pandas as pd
import ast
import re

print("🚿 LIGANDO A MÁQUINA DE LAVAR DADOS (ETL)...")

try:
    # 1. Carrega os dados brutos interceptados
    print("📥 Lendo a base suja do E-Compras...")
    df_bruto = pd.read_csv("base_ecompras_am_2026.csv", sep=';', encoding='utf-8-sig')

    # 2. Transforma o texto da coluna 'item' em listas de verdade do Python
    def extrair_itens(texto):
        try:
            return ast.literal_eval(str(texto))
        except:
            return []

    print("💣 Explodindo os dados aninhados (JSON)...")
    df_bruto['itens_lista'] = df_bruto['item'].apply(extrair_itens)

    # 3. "Explode" a tabela: 1 licitação com 10 produtos vira 10 linhas independentes!
    df_explodido = df_bruto.explode('itens_lista').dropna(subset=['itens_lista'])

    # 4. Transforma as chaves do dicionário em colunas normais (produto, qtd, empresa, etc)
    df_itens = pd.json_normalize(df_explodido['itens_lista'])

    # Junta as informações do órgão com as informações do produto
    df_explodido = df_explodido.reset_index(drop=True)
    df_itens = df_itens.reset_index(drop=True)
    df_limpo = pd.concat([df_explodido[['edital_processo', 'nome_ug', 'objeto', 'status']], df_itens], axis=1)

    print("🧽 Higienizando valores financeiros e extraindo CNPJs...")

    # 5. Higienização Matemática (Tira R$, pontos e transforma em Float)
    def limpar_dinheiro(valor):
        try:
            v = str(valor).replace('R$', '').replace('.', '').replace(',', '.').strip()
            return float(v) if v else 0.0
        except:
            return 0.0

    df_limpo['Valor_Unitario'] = df_limpo['vl_unit'].apply(limpar_dinheiro)
    df_limpo['Valor_Total_Item'] = df_limpo['vl_total'].apply(limpar_dinheiro)
    df_limpo['Qtd'] = pd.to_numeric(df_limpo['qtd'], errors='coerce').fillna(0)

    # 6. Caçador de CNPJ (Extrai só os 14 números do meio do texto da empresa)
    def cacar_cnpj(texto):
        numeros = re.sub(r'[^0-9]', '', str(texto))
        if len(numeros) >= 14:
            cnpj = numeros[-14:] # Pega os últimos 14 números
            return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"
        return "NÃO INFORMADO"

    df_limpo['CNPJ_Vencedor'] = df_limpo['empresa'].apply(cacar_cnpj)
    df_limpo['Nome_da_Empresa'] = df_limpo['empresa'].astype(str).str.replace(r'[^a-zA-Z\s]', '', regex=True).str.strip()

    # 7. Filtro Fino: Só queremos quem já ganhou (Tiramos licitações 'Em Elaboração' e sem CNPJ)
    df_final = df_limpo[(df_limpo['CNPJ_Vencedor'] != 'NÃO INFORMADO') & (df_limpo['Valor_Total_Item'] > 0)]

    # 8. SUBSTITUI A NOSSA BASE ANTIGA PELA BASE REAL DO GOVERNO!
    # Repare que estamos usando virgula (,) para não quebrar seus outros scripts
    df_final.to_csv("base_fiscalizacao_am.csv", index=False, encoding='utf-8-sig', sep=',')

    print("\n" + "="*80)
    print("✨ DADOS LAVADOS COM SUCESSO! ✨")
    print(f"Total de produtos/contratos reais prontos para auditoria: {len(df_final)} linhas.")
    print("Salvo como: 'base_fiscalizacao_am.csv' (Substituiu a base de testes!)")
    print("="*80)

except Exception as e:
    print(f"❌ Erro Crítico na Lavagem: {e}")