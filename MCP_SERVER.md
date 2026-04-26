# MCP Server — AlugEasy

**Data**: 24 de Abril de 2026  
**Status**: ✅ Funcional — servidor respondendo via stdio  
**Responsável**: Arthur

---

## O que é o MCP Server

O **Model Context Protocol (MCP)** permite que agentes de IA (Claude Code, Claude API) se conectem diretamente ao codebase do AlugEasy e executem ações estruturadas. Em vez de colar código no chat, o agente chama *tools* tipadas que retornam dados reais do projeto.

O servidor `alugueasy-dev` expõe o codebase como uma API local consumida pelo Claude Code automaticamente ao abrir o projeto.

---

## Estrutura de arquivos

```
mcp_server/
├── server.py           # Servidor FastMCP com tools, resources e prompts
├── requirements.txt    # fastmcp + python-dotenv
├── .env                # Credenciais locais (NÃO vai para o git)
└── .venv/              # Ambiente virtual Python isolado (NÃO vai para o git)
    └── Scripts/
        └── python.exe  # Executável usado pelo Claude Code
```

---

## Configuração do ambiente

### Pré-requisitos
- Python 3.13+
- Claude Code (CLI ou extensão VSCode)

### Setup inicial (já feito — apenas para referência)

```bash
# 1. Criar ambiente virtual
python3 -m venv mcp_server/.venv

# 2. Instalar dependências (Windows)
mcp_server\.venv\Scripts\pip install -r mcp_server/requirements.txt

# 3. Verificar instalação
mcp_server\.venv\Scripts\python -c "import fastmcp; print(fastmcp.__version__)"
# Saída esperada: 3.2.4
```

### Variáveis de ambiente (`mcp_server/.env`)

```env
# Supabase
SUPABASE_URL=https://<project_id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...       # Dashboard → Settings → API → Secret keys

# Caminho raiz do projeto (lido pelo server.py via os.getenv)
ALUGUEASY_PROJECT_ROOT=C:\Users\arthu\OneDrive\Documentos\Alugueasy tarefas

# Token de autenticação do MCP (trocar em produção)
MCP_AUTH_TOKEN=dev-token-change-in-production

# Servidor
MCP_PORT=8000
LOG_LEVEL=INFO
```

> **Importante:** o `server.py` lê `ALUGUEASY_PROJECT_ROOT` via `os.getenv("ALUGUEASY_PROJECT_ROOT", "../")`. Este valor define o diretório base para todas as operações de leitura de arquivo.

---

## Registro no Claude Code (`.mcp.json`)

O arquivo `.mcp.json` na raiz do projeto registra o servidor. **Este arquivo não vai para o git** pois pode conter API keys de outras integrações.

```json
{
  "mcpServers": {
    "alugueasy-dev": {
      "command": "C:\\Users\\arthu\\OneDrive\\Documentos\\Alugueasy tarefas\\mcp_server\\.venv\\Scripts\\python.exe",
      "args": ["mcp_server/server.py"],
      "env": {
        "PYTHONPATH": ".",
        "PYTHONIOENCODING": "utf-8"
      }
    }
  }
}
```

> **Nota Windows:** o venv usa `Scripts\python.exe` (não `bin/python` como no Linux/macOS).  
> **PYTHONPATH "."** garante que `from mcp_server.server import ...` resolva corretamente.  
> **PYTHONIOENCODING "utf-8"** evita erros com caracteres especiais no terminal Windows (cp1252).

---

## Tools disponíveis

| Tool | Descrição | Parâmetros |
|---|---|---|
| `read_file` | Lê conteúdo de um arquivo do projeto | `file_path: str` (relativo ao root) |
| `list_components` | Lista todos os `.tsx`/`.ts` em `src/` | nenhum |
| `list_project_structure` | Árvore de arquivos de um diretório | `directory: str` (padrão: raiz) |
| `get_db_schema` | Retorna schema do Supabase + tipos TypeScript | nenhum |
| `get_project_context` | Contexto completo: stack, equipe, arquitetura | nenhum |
| `suggest_improvement` | Lê um componente e prepara análise de melhoria | `component_path: str`, `improvement_type: str` |

### Tipos de análise em `suggest_improvement`
- `performance` → React.memo, lazy loading, virtualização
- `accessibility` → ARIA, teclado, contraste
- `typescript` → tipagem mais estrita, generics
- `testing` → cobertura de testes sugerida
- `general` → análise completa (padrão)

### Segurança das tools
- **Path traversal bloqueado:** caminhos fora do `PROJECT_ROOT` são rejeitados
- **Extensões permitidas:** `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.json`, `.md`, `.sql`
- **Diretórios proibidos:** `.git`, `node_modules`, `dist`, `build`, `.env`
- **Limite de tamanho:** 100 KB por arquivo

---

## Resources disponíveis

| URI | Descrição |
|---|---|
| `alugueasy://src/{file_path}` | Leitura direta de arquivo fonte |
| `alugueasy://schema` | Schema completo do banco de dados |
| `alugueasy://docs` | Documentação completa do projeto |
| `alugueasy://config` | Arquivos de configuração (`package.json`, `vite.config.ts`, etc.) |

---

## Prompts disponíveis

| Prompt | Descrição | Parâmetros |
|---|---|---|
| `review_component` | Revisão completa de componente React (checklist Monday.com) | `component_name`, `component_path` |
| `suggest_feature` | Análise sistêmica para implementar nova feature | `feature_name`, `feature_description` |
| `audit_security` | Auditoria de segurança (RLS, auth, XSS, inputs) | nenhum |
| `improve_ux` | Melhorias de UX/UI baseadas no padrão Monday.com | `screen_name` |

---

## Correção aplicada na instalação

A versão **FastMCP 3.2.4** removeu o parâmetro `description` do construtor `FastMCP()`. O `server.py` original foi corrigido:

```python
# ANTES (quebrava com TypeError)
mcp = FastMCP(
    name="alugueasy-mcp",
    version="1.0.0",
    description="MCP Server do Alugueasy Operacional. ...",
)

# DEPOIS (correto para FastMCP 3.x)
mcp = FastMCP(
    name="alugueasy-mcp",
    version="1.0.0",
)
```

---

## Teste de funcionamento

Para verificar se o servidor está respondendo corretamente via protocolo MCP/stdio:

```python
# Salvar como test_mcp.py e rodar com o Python do venv
import subprocess, json, sys, os

msg = json.dumps({
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "test", "version": "1.0"}
    },
    "id": 1
})

proc = subprocess.Popen(
    [sys.executable, "mcp_server/server.py"],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    env={**os.environ, "PYTHONPATH": ".", "PYTHONIOENCODING": "utf-8"},
    cwd=r"C:\Users\arthu\OneDrive\Documentos\Alugueasy tarefas"
)
stdout, _ = proc.communicate(input=(msg + "\n").encode("utf-8"), timeout=10)
print(stdout.decode("utf-8"))
```

**Resposta esperada:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "serverInfo": { "name": "alugueasy-mcp", "version": "1.0.0" },
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": false },
      "prompts": { "listChanged": false }
    }
  }
}
```

---

## Métricas do codebase (abril 2026)

| Métrica | Valor |
|---|---|
| Total de arquivos em `src/` | 82 |
| Componentes `.tsx` | 72 |
| Arquivos `.ts` puros | 3 |
| Linhas TypeScript (`.ts` + `.tsx`) | 9.776 |
| Linhas CSS | 346 |
| Ratio TypeScript / total | **96,6%** |
| Componente mais complexo | `TaskDetailPanel.tsx` (756 linhas, 32 KB) |
| 2º mais complexo | `SettingsScreen.tsx` (651 linhas, 32 KB) |
| 3º mais complexo | `TaskTable.tsx` (550 linhas, 27 KB) |

---

## Segurança e Git

Os seguintes arquivos **nunca devem ir para o git** (já configurado no `.gitignore`):

| Arquivo/Pasta | Motivo |
|---|---|
| `mcp_server/.env` | Contém `SUPABASE_SERVICE_ROLE_KEY` |
| `mcp_server/.venv/` | Ambiente virtual (centenas de arquivos binários) |
| `.mcp.json` | Pode conter API keys de integrações (Obsidian, etc.) |
| `.claude/settings.local.json` | Contém tokens e permissões locais do Claude Code |
| `Sistema Alugueasy Tarefas/` | Vault Obsidian com chave privada RSA e certificados TLS |

> **Atenção:** o vault do Obsidian (`Sistema Alugueasy Tarefas/.obsidian/plugins/obsidian-local-rest-api/data.json`) contém a chave privada RSA do certificado TLS local e a API key do plugin. Estes dados foram removidos do rastreamento git em 24/04/2026.

---

## Próximas melhorias sugeridas para o servidor MCP

- [ ] Adicionar tool `get_code_metrics` → retorna total de arquivos, linhas por extensão, ratio TS
- [ ] Adicionar tool `get_dependencies` → lê `package.json` e retorna deps/devDeps estruturados
- [ ] Adicionar tool `analyze_component` → análise estática de complexidade por componente
- [ ] Adicionar tool `search_in_files` → busca por padrão regex nos arquivos do projeto
- [ ] Adicionar prompt `audit_vs_monday` → comparação estruturada com features do Monday.com
- [ ] Autenticação via `MCP_AUTH_TOKEN` nas tools (middleware de validação)
- [ ] Suporte a `write_file` com confirmação (para aplicar sugestões diretamente)

---

**Última atualização**: 24 de Abril de 2026  
**Versão FastMCP**: 3.2.4  
**Versão Python (venv)**: 3.13  
**Desenvolvido por**: Arthur
