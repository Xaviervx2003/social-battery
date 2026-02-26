import os
import shutil
import glob

print("🏗️ INICIANDO REESTRUTURAÇÃO DO PROJETO (MVC)...")

# Cria as pastas principais da arquitetura
pastas = ['scripts', 'dados', 'web']
for p in pastas:
    os.makedirs(p, exist_ok=True)
    print(f"📁 Pasta verificada/criada: {p}/")

print("\n🚚 Movendo os arquivos para seus novos lares...")

# 1. Move todas as planilhas para a pasta /dados
for csv in glob.glob('*.csv'):
    shutil.move(csv, os.path.join('dados', csv))
    print(f"  -> {csv} movido para /dados")

# 2. Atualiza e move o Painel HTML para a pasta /web
if os.path.exists('index.html'):
    print("  -> Atualizando rotas dentro do index.html...")
    with open('index.html', 'r', encoding='utf-8') as f:
        conteudo_html = f.read()
    
    # Ensina o JavaScript a voltar uma pasta (../) e entrar na pasta dados para achar os CSVs
    conteudo_html = conteudo_html.replace('safeLoad("', 'safeLoad("../dados/')
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(conteudo_html)
        
    shutil.move('index.html', os.path.join('web', 'index.html'))
    print("  -> index.html atualizado e movido para /web")

# 3. Move os robôs e extratores para a pasta /scripts
for py in glob.glob('*.py'):
    if py != 'arquitetura.py':
        shutil.move(py, os.path.join('scripts', py))
        print(f"  -> {py} movido para /scripts")

print("\n✅ ORGANIZAÇÃO CONCLUÍDA! Sua 'pasta de hack' agora é um projeto profissional.")
