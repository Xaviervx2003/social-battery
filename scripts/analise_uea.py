import pandas as pd
import unicodedata

def remover_acentos(texto):
    """Limpa os nomes para o computador não confundir JOÃO com JOAO."""
    if pd.isna(texto):
        return ""
    texto_str = str(texto).upper().strip()
    return ''.join(c for c in unicodedata.normalize('NFD', texto_str) if unicodedata.category(c) != 'Mn')

print("🔎 INICIANDO OPERAÇÃO MALHA FINA (BASE UEA)...")

try:
    # 1. Carregando os donos de empresas
    df_socios = pd.read_csv("RANKING_SOCIOS_AM_2026.csv")
    
    # 2. Carregando o arquivo da UEA
    df_uea = pd.read_csv("dados_uea.csv", sep=';', encoding='latin1')
    
    # Limpando os nomes das colunas para evitar erros de espaços invisíveis
    df_uea.columns = df_uea.columns.str.strip()

    # Tratando os nomes (Tirando acentos e colocando tudo em maiúsculo)
    df_socios['Nome_do_Socio'] = df_socios['Nome_do_Socio'].apply(remover_acentos)
    df_uea['NOME'] = df_uea['NOME'].apply(remover_acentos)

    socios_nomes = df_socios['Nome_do_Socio'].dropna().unique()

    print(f"⚙️ Cruzando {len(socios_nomes)} donos de empresas com {len(df_uea)} servidores da UEA...")
    
    alertas = []
    # Ignoramos sobrenomes comuns no Brasil para evitar "falso positivo"
    sobrenomes_comuns = ['FILHO', 'JUNIOR', 'NETO', 'SILVA', 'SANTOS', 'SOUZA', 'OLIVEIRA', 'COSTA', 'LIMA', 'PEREIRA', 'FERREIRA', 'ALVES', 'MENDES', 'GOMES']

    for socio in socios_nomes:
        if not socio or socio == "NAN":
            continue
            
        partes_socio = socio.split()
        if len(partes_socio) < 2:
            continue
            
        sobrenome_socio = partes_socio[-1]

        for _, servidor in df_uea.iterrows():
            serv_nome = servidor['NOME']
            cargo = servidor.get('CARGO', 'Não Informado')
            lotacao = servidor.get('LOTACAO', 'Não Informado')
            salario = servidor.get('REMUNERACAO LEGAL TOTAL(R$)', 'N/A')

            # REGRA 1: CRIME DIRETO (O Sócio é o Servidor da UEA)
            if socio == serv_nome:
                alertas.append({
                    'Dono_da_Empresa': socio,
                    'Servidor_UEA': serv_nome,
                    'Cargo': cargo,
                    'Lotacao': lotacao,
                    'Salario': salario,
                    'Nivel_Risco': '🚨 GRAVE: Sócio é Servidor da UEA'
                })
            
            # REGRA 2: NEPOTISMO/PARENTESCO (Mesmo Sobrenome raro)
            elif sobrenome_socio not in sobrenomes_comuns and sobrenome_socio in serv_nome.split():
                alertas.append({
                    'Dono_da_Empresa': socio,
                    'Servidor_UEA': serv_nome,
                    'Cargo': cargo,
                    'Lotacao': lotacao,
                    'Salario': salario,
                    'Nivel_Risco': f'⚠️ ATENÇÃO: Possível Parentesco ({sobrenome_socio})'
                })

    df_alertas = pd.DataFrame(alertas)

    print("\n" + "="*100)
    print("🚨 RELATÓRIO FINAL DE CONFLITO DE INTERESSES: FORNECEDORES x SERVIDORES DA UEA 🚨")
    print("="*100)

    if df_alertas.empty:
        print("✅ Limpo! Nenhum fornecedor do Estado cruzou com a folha de pagamento da UEA.")
    else:
        pd.set_option('display.max_colwidth', None)
        print(df_alertas.to_string(index=False))
        df_alertas.to_csv("ALERTA_UEA_AM.csv", index=False, encoding='utf-8-sig', sep=';')
        print(f"\n💾 Dossiê salvo na sua pasta como 'ALERTA_UEA_AM.csv'")

except Exception as e:
    print(f"❌ Erro crítico: {e}")