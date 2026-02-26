import pandas as pd
import unicodedata

def remover_acentos(texto):
    """Função para limpar os nomes, tirando acentos para o robô não se confundir (ex: JOÃO = JOAO)"""
    if pd.isna(texto):
        return ""
    texto_str = str(texto).upper().strip()
    return ''.join(c for c in unicodedata.normalize('NFD', texto_str) if unicodedata.category(c) != 'Mn')

print("🔎 INICIANDO OPERAÇÃO NEPOTISMO (BASE REAL)...")

try:
    # 1. Lendo os sócios milionários
    print("📥 Carregando base de Sócios (Receita Federal)...")
    df_socios = pd.read_csv("RANKING_SOCIOS_AM_2026.csv")
    
    # 2. Lendo a Folha de Pagamento REAL do Estado
    print("📥 Carregando Folha de Pagamento do Amazonas (servidores_am.csv)...")
    try:
        # Tenta ler o arquivo que você baixou. Se tiver erro de acento, ele usa o 'latin1'
        df_servidores = pd.read_csv("servidores_am.csv", sep=';', encoding='utf-8')
    except UnicodeDecodeError:
        df_servidores = pd.read_csv("servidores_am.csv", sep=';', encoding='latin1')
    except FileNotFoundError:
        print("❌ ERRO: O arquivo 'servidores_am.csv' não foi encontrado na sua pasta!")
        print("Crie um arquivo Excel, coloque as colunas NOME, CARGO e ORGAO, salve como CSV e tente de novo.")
        exit()

    # Tratando os nomes para caixa alta e sem acento
    df_socios['Nome_do_Socio'] = df_socios['Nome_do_Socio'].apply(remover_acentos)
    df_servidores['NOME'] = df_servidores['NOME'].apply(remover_acentos)

    socios_nomes = df_socios['Nome_do_Socio'].dropna().unique()

    print("⚙️ Cruzando CPFs, Árvores Genealógicas e Conflitos Diretos. Aguarde...")
    
    alertas = []
    # Sobrenomes comuns que ignoramos para não acusar "Silva" cruzando com "Silva" à toa
    sobrenomes_comuns = ['FILHO', 'JUNIOR', 'NETO', 'SILVA', 'SANTOS', 'SOUZA', 'OLIVEIRA', 'COSTA', 'LIMA', 'PEREIRA', 'FERREIRA']

    # O Motor de Busca Cruza as Duas Bases
    for socio in socios_nomes:
        if not socio or socio == "NAN":
            continue
            
        partes_socio = socio.split()
        if len(partes_socio) < 2:
            continue
            
        sobrenome_socio = partes_socio[-1]

        # Busca na base inteira de servidores de uma vez só (muito mais rápido)
        for _, servidor in df_servidores.iterrows():
            serv_nome = servidor['NOME']
            cargo = servidor.get('CARGO', 'Não Informado')
            orgao = servidor.get('ORGAO', 'Não Informado')

            # REGRA 1: CRIME DIRETO (O Sócio é o Servidor)
            if socio == serv_nome:
                alertas.append({
                    'Empresario_Socio': socio,
                    'Ligacao_Estado': serv_nome,
                    'Cargo_Governo': cargo,
                    'Orgao': orgao,
                    'Grau_de_Risco': '🚨 GRAVE: Sócio também é Servidor Público'
                })
            
            # REGRA 2: NEPOTISMO/LARANJA (Mesmo Sobrenome raro)
            elif sobrenome_socio not in sobrenomes_comuns and sobrenome_socio in serv_nome.split():
                alertas.append({
                    'Empresario_Socio': socio,
                    'Ligacao_Estado': serv_nome,
                    'Cargo_Governo': cargo,
                    'Orgao': orgao,
                    'Grau_de_Risco': f'⚠️ ATENÇÃO: Compartilha Sobrenome ({sobrenome_socio})'
                })

    # 4. Exibindo os Resultados
    df_alertas = pd.DataFrame(alertas)

    print("\n" + "="*90)
    print("🚨 REDE DE INFLUÊNCIA: SERVIDORES E FAMILIARES LIGADOS A CONTRATOS 🚨")
    print("="*90)

    if df_alertas.empty:
        print("✅ Nenhum cruzamento suspeito encontrado entre a base de sócios e os servidores.")
    else:
        pd.set_option('display.max_colwidth', None)
        print(df_alertas.to_string(index=False))
        df_alertas.to_csv("ALERTA_NEPOTISMO_AM.csv", index=False, encoding='utf-8-sig', sep=';')
        print(f"\n💾 Dossiê de Conflito de Interesses salvo como 'ALERTA_NEPOTISMO_AM.csv'")

except Exception as e:
    print(f"❌ Erro na operação: {e}")