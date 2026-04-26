import sys, json, pathlib

sys.path.insert(0, r'C:\Users\arthu\OneDrive\Documentos\Alugueasy tarefas')
from mcp_server.server import list_project_structure, list_components, PROJECT_ROOT

# 1. Estrutura completa de src/app/components
raw = list_project_structure('src/app/components')
struct = json.loads(raw)
print(f"=== list_project_structure('src/app/components') ===")
print(f"Total arquivos: {struct['total_files']}")

# 2. Todos os .tsx/.ts com contagem de linhas
print("\n=== Metricas por arquivo ===")
files_with_lines = []
root = PROJECT_ROOT
for f in struct['files']:
    fpath = root / f['path']
    try:
        lines = len(fpath.read_text(encoding='utf-8', errors='replace').splitlines())
        files_with_lines.append((f['path'], lines, f['extension'], f['size_bytes']))
    except:
        pass

# Top 10 por linhas
files_with_lines.sort(key=lambda x: x[1], reverse=True)
print(f"{'Arquivo':<60} {'Linhas':>6} {'Bytes':>8}")
print("-" * 76)
for path, lines, ext, size in files_with_lines[:10]:
    name = path.split('\\')[-1] if '\\\\' in path else path.split('/')[-1]
    print(f"{path[-58:]:<60} {lines:>6} {size:>8}")

# 3. Metricas globais
all_raw = list_project_structure('')
all_struct = json.loads(all_raw)
total_files = all_struct['total_files']
ts_files = [f for f in all_struct['files'] if f['extension'] in ('.ts', '.tsx')]
other_files = [f for f in all_struct['files'] if f['extension'] not in ('.ts', '.tsx')]

ts_lines = 0
total_lines = 0
ts_bytes = sum(f['size_bytes'] for f in ts_files)
total_bytes = sum(f['size_bytes'] for f in all_struct['files'])

for f in all_struct['files']:
    fpath = root / f['path']
    try:
        n = len(fpath.read_text(encoding='utf-8', errors='replace').splitlines())
        total_lines += n
        if f['extension'] in ('.ts', '.tsx'):
            ts_lines += n
    except:
        pass

print(f"\n=== Metricas globais ===")
print(f"Total arquivos rastreados : {total_files}")
print(f"Arquivos .ts/.tsx         : {len(ts_files)}")
print(f"Total linhas              : {total_lines}")
print(f"Linhas TypeScript         : {ts_lines}")
print(f"Ratio TS/total (linhas)   : {ts_lines/total_lines*100:.1f}%")
print(f"Ratio TS/total (bytes)    : {ts_bytes/total_bytes*100:.1f}%")
