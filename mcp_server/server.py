"""
EasyTask MCP Server
====================
Servidor MCP que expõe o codebase e schema do EasyTask para agentes de IA.
Permite que Claude Code, Claude API e outros agentes leiam, analisem e
sugiram melhorias para o sistema de forma segura e autenticada.

Requisitos:
    pip install fastmcp python-dotenv supabase

Execução:
    python server.py
    # ou via Claude Code:
    # claude mcp add easytask-mcp python server.py
"""

import difflib
import inspect
import json
import logging
import os
import pathlib
import re
from datetime import datetime, timedelta, date
from functools import wraps
from dotenv import load_dotenv
from fastmcp import FastMCP, Context

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

load_dotenv(pathlib.Path(__file__).parent / ".env")

# Caminho raiz do projeto EasyTask (ajuste para o seu caminho local)
# Aceita EASYTASK_PROJECT_ROOT (novo) ou ALUGUEASY_PROJECT_ROOT (legado) para retrocompatibilidade
PROJECT_ROOT = pathlib.Path(
    os.getenv("EASYTASK_PROJECT_ROOT") or os.getenv("ALUGUEASY_PROJECT_ROOT", "../")
).resolve()

# Token de autenticação — defina em .env como MCP_AUTH_TOKEN=sua_chave_secreta
MCP_AUTH_TOKEN = os.getenv("MCP_AUTH_TOKEN", "dev-token-change-in-production")

_AUTH_CONFIGURED = (
    bool(MCP_AUTH_TOKEN) and MCP_AUTH_TOKEN != "dev-token-change-in-production"
)

if not _AUTH_CONFIGURED:
    logging.warning(
        "MCP_AUTH_TOKEN não configurado ou usando valor padrão — "
        "servidor rodando sem autenticação. Defina MCP_AUTH_TOKEN no .env para produção."
    )


def require_auth(func):
    """Valida MCP_AUTH_TOKEN antes de executar a tool.

    Se o token não estiver configurado no .env, loga WARNING e executa normalmente.
    Se estiver configurado e auth_token não bater, retorna erro 401.
    Injeta o parâmetro `auth_token: str = ""` na assinatura visível ao FastMCP.
    """
    sig = inspect.signature(func)
    if "auth_token" not in sig.parameters:
        extra = inspect.Parameter(
            "auth_token",
            inspect.Parameter.POSITIONAL_OR_KEYWORD,
            default="",
            annotation=str,
        )
        new_sig = sig.replace(parameters=[*sig.parameters.values(), extra])
    else:
        new_sig = sig

    @wraps(func)
    def wrapper(*args, auth_token: str = "", **kwargs):
        if _AUTH_CONFIGURED and auth_token != MCP_AUTH_TOKEN:
            return {"error": "Unauthorized", "code": 401}
        return func(*args, **kwargs)

    wrapper.__signature__ = new_sig
    wrapper.__annotations__ = {**func.__annotations__, "auth_token": str}
    return wrapper


# Extensões de código que o agente pode ler
ALLOWED_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".css", ".json", ".md", ".sql"}

# Diretórios proibidos (nunca expõe ao agente)
FORBIDDEN_DIRS = {
    ".git", "node_modules", "dist", "build", ".env",
    ".venv",                      # ambiente Python
    "Sistema EasyTask Tarefas",  # vault Obsidian
    "__pycache__",                # cache Python
    ".obsidian",                  # config Obsidian
    "backups",                    # backups do MCP
}

# ---------------------------------------------------------------------------
# Inicialização do servidor FastMCP
# ---------------------------------------------------------------------------

mcp = FastMCP(
    name="easytask-mcp",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# Utilitários internos
# ---------------------------------------------------------------------------

def _validate_path(relative_path: str) -> pathlib.Path:
    """
    Valida e resolve um caminho relativo dentro do projeto.
    Impede path traversal (ex: ../../etc/passwd).
    """
    resolved = (PROJECT_ROOT / relative_path).resolve()

    # Garante que o caminho está dentro do projeto
    if not str(resolved).startswith(str(PROJECT_ROOT)):
        raise ValueError(f"Acesso negado: '{relative_path}' está fora do projeto.")

    # Verifica diretórios proibidos
    for part in resolved.parts:
        if part in FORBIDDEN_DIRS:
            raise ValueError(f"Acesso negado: diretório '{part}' é restrito.")

    return resolved


def _is_readable(path: pathlib.Path) -> bool:
    """Verifica se o arquivo tem extensão permitida."""
    return path.suffix.lower() in ALLOWED_EXTENSIONS


def _walk_project(base_dir: pathlib.Path, max_files: int = 200) -> list[dict]:
    """
    Percorre o diretório do projeto e retorna estrutura de arquivos.
    Respeita limites de segurança e tamanho.
    """
    files = []
    count = 0

    for path in base_dir.rglob("*"):
        if count >= max_files:
            break

        # Pula diretórios proibidos
        if any(forbidden in path.parts for forbidden in FORBIDDEN_DIRS):
            continue

        if path.is_file() and _is_readable(path):
            relative = path.relative_to(PROJECT_ROOT)
            files.append({
                "path": str(relative),
                "extension": path.suffix,
                "size_bytes": path.stat().st_size,
            })
            count += 1

    return files


# ---------------------------------------------------------------------------
# TOOLS — Ações que o agente pode executar
# ---------------------------------------------------------------------------

@mcp.tool()
def read_file(file_path: str) -> str:
    """
    Lê o conteúdo de um arquivo do projeto EasyTask.

    Args:
        file_path: Caminho relativo ao root do projeto.
                   Exemplos: 'src/app/App.tsx', 'src/lib/supabase.ts'

    Returns:
        Conteúdo completo do arquivo como texto.
    """
    try:
        resolved = _validate_path(file_path)

        if not resolved.is_file():
            return f"Arquivo não encontrado: {file_path}"

        if not _is_readable(resolved):
            return (
                f"Extensão não permitida: {resolved.suffix}. "
                f"Extensões suportadas: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        # Limite de tamanho: 100KB por arquivo
        if resolved.stat().st_size > 100_000:
            return f"Arquivo muito grande ({resolved.stat().st_size} bytes). Máximo: 100KB."

        return resolved.read_text(encoding="utf-8", errors="replace")

    except ValueError as e:
        return f"Erro de segurança: {e}"
    except Exception as e:
        return f"Erro ao ler arquivo: {e}"


@mcp.tool()
def list_components() -> str:
    """
    Lista todos os componentes React do projeto EasyTask.

    Returns:
        JSON com nome, caminho e tamanho de cada componente .tsx/.ts
    """
    components_dir = PROJECT_ROOT / "src" / "app" / "components"

    if not components_dir.exists():
        # Fallback: busca em todo o src/
        components_dir = PROJECT_ROOT / "src"

    try:
        files = _walk_project(components_dir)
        tsx_files = [f for f in files if f["extension"] in (".tsx", ".ts")]

        result = {
            "total": len(tsx_files),
            "components": tsx_files,
            "project_root": str(PROJECT_ROOT),
        }
        return json.dumps(result, indent=2, ensure_ascii=False)

    except Exception as e:
        return f"Erro ao listar componentes: {e}"


@mcp.tool()
def get_db_schema() -> str:
    """
    Retorna o schema do banco de dados Supabase do EasyTask.
    Baseado no arquivo SUPABASE_SETUP.md e arquivos de tipos TypeScript.

    Returns:
        Schema detalhado das tabelas: tasks, workspaces, comments, subtasks
    """
    # Tenta ler o arquivo de setup do Supabase
    setup_files = [
        "SUPABASE_SETUP.md",
        "src/lib/supabase.ts",
        "src/lib/database.types.ts",
    ]

    schema_content = []

    for file_path in setup_files:
        try:
            resolved = _validate_path(file_path)
            if resolved.exists():
                content = resolved.read_text(encoding="utf-8", errors="replace")
                schema_content.append(f"## {file_path}\n\n{content}")
        except Exception:
            continue

    if schema_content:
        return "\n\n---\n\n".join(schema_content)

    # Fallback: retorna schema conhecido do projeto
    return """
## Schema EasyTask (baseado na documentação do projeto)

### Tabela: tasks
- id: UUID (PK)
- title: TEXT NOT NULL
- description: TEXT
- status: TEXT ('Pendente' | 'Em Andamento' | 'Revisão' | 'Concluído')
- priority: TEXT ('Baixa' | 'Média' | 'Alta' | 'Crítica')
- group: TEXT ('Operacional' | 'Desenvolvimento' | 'Financeiro')
- assignee: TEXT ('Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas')
- due_date: DATE
- tags: TEXT[]
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

### Tabela: workspaces
- id: UUID (PK)
- name: TEXT NOT NULL
- description: TEXT
- icon: TEXT
- color: TEXT (hex)
- created_by: TEXT (membro da equipe)
- created_at: TIMESTAMPTZ

### Tabela: comments
- id: UUID (PK)
- task_id: UUID (FK → tasks.id)
- author: TEXT
- content: TEXT
- created_at: TIMESTAMPTZ

### Tabela: subtasks
- id: UUID (PK)
- task_id: UUID (FK → tasks.id)
- title: TEXT
- completed: BOOLEAN
- created_at: TIMESTAMPTZ
"""


@mcp.tool()
def list_project_structure(directory: str = "") -> str:
    """
    Lista a estrutura de diretórios e arquivos do projeto.

    Args:
        directory: Subdiretório a listar (vazio = raiz do projeto).
                   Exemplos: 'src', 'src/app/components'

    Returns:
        Árvore de arquivos em formato JSON.
    """
    try:
        base = _validate_path(directory) if directory else PROJECT_ROOT
        files = _walk_project(base, max_files=150)

        return json.dumps({
            "base_directory": directory or ".",
            "total_files": len(files),
            "files": files,
        }, indent=2, ensure_ascii=False)

    except ValueError as e:
        return f"Erro: {e}"


@mcp.tool()
def get_project_context() -> str:
    """
    Retorna o contexto completo do projeto EasyTask para o agente.
    Inclui: stack tecnológica, membros da equipe, regras de negócio e arquitetura.

    Returns:
        Contexto estruturado do projeto como texto.
    """
    context_files = ["DOCUMENTATION.md", "README.md", "SUPABASE_SETUP.md"]

    docs = []
    for file_name in context_files:
        try:
            resolved = _validate_path(file_name)
            if resolved.exists():
                content = resolved.read_text(encoding="utf-8", errors="replace")
                # Limita a 5000 chars por doc para não explodir o contexto
                docs.append(f"## {file_name}\n\n{content[:5000]}")
        except Exception:
            continue

    if docs:
        return "\n\n---\n\n".join(docs)

    return """
## Contexto do Projeto EasyTask

**Stack:** React 18 + TypeScript + Tailwind CSS v4 + Vite + Supabase

**Equipe (4 membros):**
- Arthur  (#4A9EDB)
- Yasmim  (#F472B6)
- Alexandre (#34D399)
- Nikolas (#F59E0B)

**Cores da marca:**
- Primary: #1E3A5F (navy)
- Secondary: #A8B4C0 (slate gray)
- Background: #F4F6F9

**Objetivo:** Sistema de gestão de tarefas inspirado no Monday.com,
focado em equipes de aluguel de imóveis de curta temporada.

**Visualizações implementadas:** Board Kanban, Tabela, Calendário, Gantt, Relatórios

**Status:** ~75% implementado, faltam testes, responsividade mobile e colaboração em tempo real.
"""


@mcp.tool()
def suggest_improvement(
    component_path: str,
    improvement_type: str = "general",
) -> str:
    """
    Lê um componente e gera um relatório estruturado de melhorias.

    Args:
        component_path: Caminho do componente (ex: 'src/app/components/Dashboard.tsx')
        improvement_type: Tipo de análise:
            - 'performance' → React.memo, lazy loading, virtualização
            - 'accessibility' → ARIA, teclado, contraste
            - 'typescript' → tipagem mais estrita, generics
            - 'testing' → cobertura de testes sugerida
            - 'general' → análise completa

    Returns:
        Relatório de melhorias em markdown.
    """
    # Lê o arquivo
    content = read_file(component_path)

    if content.startswith("Erro") or content.startswith("Arquivo não"):
        return content

    # Retorna o conteúdo + instruções para o agente analisar
    # (o próprio agente que chamou este tool fará a análise)
    return f"""
## Arquivo para análise: {component_path}
## Tipo de análise solicitada: {improvement_type}

### Conteúdo do arquivo:
```typescript
{content[:8000]}
```

### Instruções para o agente:
Analise o código acima considerando o contexto do EasyTask (React + TypeScript + Tailwind + Supabase).
Foque em: {improvement_type}.
Forneça sugestões concretas com exemplos de código quando aplicável.
"""


# ---------------------------------------------------------------------------
# Cliente Supabase (lazy — só conecta quando uma tool precisar)
# ---------------------------------------------------------------------------

def _get_supabase():
    try:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        if not url or not key:
            return None
        return create_client(url, key)
    except Exception:
        return None


def _fetch_tasks(sb) -> list[dict]:
    res = sb.table("tasks").select("*").execute()
    return res.data or []


def _today_str() -> str:
    return date.today().isoformat()


# ---------------------------------------------------------------------------
# TOOLS — Inteligência de Tarefas
# ---------------------------------------------------------------------------

@mcp.tool()
@require_auth
def ai_triage_task(title: str, description: str = "") -> dict:
    """
    Analisa título e descrição de uma nova tarefa e sugere: assignee ideal,
    prioridade, grupo, tags e quebra em subtarefas executáveis.
    Usar ao criar qualquer tarefa nova para maximizar qualidade dos dados.

    Args:
        title: Título da tarefa
        description: Descrição opcional com mais contexto

    Returns:
        Sugestões estruturadas: assignee, priority, group, tags, subtasks, reasoning
    """
    text = f"{title} {description}".lower()

    # ── Grupo ──────────────────────────────────────────────────────────────
    group_rules = {
        "Desenvolvimento": ["bug", "fix", "componente", "tela", "ui", "api",
                            "código", "deploy", "build", "teste", "refactor",
                            "typescript", "react", "supabase", "sql", "migration"],
        "Financeiro":      ["pagamento", "fatura", "receita", "despesa", "custo",
                            "cobrança", "financeiro", "contrato", "aluguel", "repasse"],
        "Operacional":     ["cliente", "imóvel", "reserva", "checkin", "checkout",
                            "limpeza", "manutenção", "foto", "anúncio", "airbnb"],
    }
    group = "Operacional"
    for g, keywords in group_rules.items():
        if any(k in text for k in keywords):
            group = g
            break

    # ── Prioridade ─────────────────────────────────────────────────────────
    if any(k in text for k in ["crítico", "urgente", "quebrado", "produção", "bloqueando", "bug crítico"]):
        priority = "Crítica"
    elif any(k in text for k in ["importante", "cliente esperando", "atrasado", "semana"]):
        priority = "Alta"
    elif any(k in text for k in ["melhoria", "sugestão", "quando possível", "futuro"]):
        priority = "Baixa"
    else:
        priority = "Média"

    # ── Assignee ───────────────────────────────────────────────────────────
    assignee_rules = {
        "Arthur":    ["backend", "supabase", "banco", "sql", "api", "mcp", "deploy",
                      "infraestrutura", "autenticação", "segurança"],
        "Yasmim":    ["design", "ui", "visual", "layout", "cor", "foto", "figma",
                      "responsiv", "mobile", "acessibilidade"],
        "Alexandre": ["relatório", "análise", "dado", "métrica", "financeiro",
                      "planilha", "dashboard"],
        "Nikolas":   ["teste", "qa", "qualidade", "bug", "fix", "documentação",
                      "manual", "review"],
    }
    assignee = "Arthur"
    best_score = 0
    for member, keywords in assignee_rules.items():
        score = sum(1 for k in keywords if k in text)
        if score > best_score:
            best_score = score
            assignee = member

    # ── Tags ───────────────────────────────────────────────────────────────
    tag_map = {
        "bug": ["bug", "erro", "quebrado", "falha"],
        "melhoria": ["melhoria", "otimização", "performance"],
        "ux": ["ui", "ux", "design", "visual", "layout"],
        "banco-de-dados": ["supabase", "sql", "banco", "tabela", "migration"],
        "urgente": ["urgente", "crítico", "bloqueando"],
        "mobile": ["mobile", "responsiv", "celular"],
        "documentação": ["documentação", "doc", "readme"],
        "testes": ["teste", "test", "qa", "vitest"],
    }
    tags = [tag for tag, keywords in tag_map.items() if any(k in text for k in keywords)]

    # ── Subtarefas sugeridas ────────────────────────────────────────────────
    subtask_templates = {
        "Desenvolvimento": [
            f"Analisar escopo e impacto: {title}",
            "Implementar lógica principal",
            "Adicionar tratamento de erros e edge cases",
            "Testar manualmente no ambiente local",
            "Criar PR e solicitar code review",
        ],
        "Financeiro": [
            f"Levantar dados necessários: {title}",
            "Validar números com histórico",
            "Implementar/registrar no sistema",
            "Confirmar com responsável financeiro",
        ],
        "Operacional": [
            f"Verificar situação atual: {title}",
            "Executar ação principal",
            "Confirmar conclusão com envolvidos",
            "Registrar no sistema",
        ],
    }
    subtasks = subtask_templates.get(group, subtask_templates["Operacional"])

    return {
        "suggested_assignee": assignee,
        "suggested_priority": priority,
        "suggested_group": group,
        "suggested_tags": tags,
        "suggested_subtasks": subtasks,
        "reasoning": {
            "group_reason": f"Palavras-chave de '{group}' detectadas no texto",
            "priority_reason": f"Nível '{priority}' baseado em termos de urgência",
            "assignee_reason": f"'{assignee}' tem maior match de competências para este tipo de tarefa",
        },
    }


@mcp.tool()
@require_auth
def generate_subtasks(task_title: str, context: str = "") -> dict:
    """
    Dado o título de uma tarefa grande, quebra em subtarefas executáveis
    de 2–4h cada, ordenadas por dependência.

    Args:
        task_title: Título da tarefa principal
        context: Contexto adicional (tecnologia, objetivo, constraints)

    Returns:
        Lista ordenada de subtarefas com estimativa de horas cada
    """
    text = f"{task_title} {context}".lower()

    # Templates por tipo de trabalho detectado
    if any(k in text for k in ["componente", "tela", "página", "screen", "view"]):
        subtasks = [
            {"order": 1, "title": f"Definir props e tipos TypeScript do componente", "hours": 1},
            {"order": 2, "title": f"Criar estrutura base e layout HTML/Tailwind", "hours": 2},
            {"order": 3, "title": f"Implementar lógica de estado (useState/useContext)", "hours": 2},
            {"order": 4, "title": f"Integrar com Supabase (queries e mutations)", "hours": 3},
            {"order": 5, "title": f"Adicionar loading states e tratamento de erro", "hours": 1},
            {"order": 6, "title": f"Testar responsividade mobile", "hours": 1},
            {"order": 7, "title": f"Code review e ajustes finais", "hours": 1},
        ]
    elif any(k in text for k in ["migration", "tabela", "sql", "banco", "schema"]):
        subtasks = [
            {"order": 1, "title": "Escrever SQL de migração com rollback", "hours": 2},
            {"order": 2, "title": "Validar SQL no ambiente de staging", "hours": 1},
            {"order": 3, "title": "Atualizar tipos TypeScript (database.types.ts)", "hours": 1},
            {"order": 4, "title": "Atualizar helpers em src/lib/supabase.ts", "hours": 1},
            {"order": 5, "title": "Aplicar migration em produção e verificar", "hours": 1},
        ]
    elif any(k in text for k in ["bug", "fix", "erro", "corrigir"]):
        subtasks = [
            {"order": 1, "title": f"Reproduzir o bug em ambiente local", "hours": 1},
            {"order": 2, "title": "Identificar root cause com console/devtools", "hours": 2},
            {"order": 3, "title": "Implementar correção", "hours": 2},
            {"order": 4, "title": "Verificar que não há regressão em funcionalidades relacionadas", "hours": 1},
            {"order": 5, "title": "Deploy e confirmar correção em produção", "hours": 1},
        ]
    elif any(k in text for k in ["relatório", "dashboard", "métricas", "análise"]):
        subtasks = [
            {"order": 1, "title": "Mapear quais dados/métricas são necessárias", "hours": 1},
            {"order": 2, "title": "Criar queries Supabase otimizadas", "hours": 2},
            {"order": 3, "title": "Implementar componente de visualização (Recharts)", "hours": 3},
            {"order": 4, "title": "Adicionar filtros por período e membro", "hours": 2},
            {"order": 5, "title": "Validar dados com equipe", "hours": 1},
        ]
    else:
        subtasks = [
            {"order": 1, "title": f"Definir escopo e critérios de aceite: {task_title}", "hours": 1},
            {"order": 2, "title": "Executar etapa principal", "hours": 3},
            {"order": 3, "title": "Validar resultado com responsável", "hours": 1},
            {"order": 4, "title": "Documentar e fechar tarefa", "hours": 1},
        ]

    total_hours = sum(s["hours"] for s in subtasks)
    return {
        "task_title": task_title,
        "subtasks": subtasks,
        "total_estimated_hours": total_hours,
        "total_estimated_days": round(total_hours / 6, 1),
    }


@mcp.tool()
@require_auth
def detect_duplicate_tasks() -> dict:
    """
    Compara todas as tarefas abertas e detecta duplicatas ou tarefas muito
    similares. Sugere merge ou exclusão para manter o backlog limpo.

    Returns:
        Lista de grupos de tarefas similares com sugestão de ação
    """
    sb = _get_supabase()
    if not sb:
        return {"error": "Supabase não configurado. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env"}

    tasks = _fetch_tasks(sb)
    open_tasks = [t for t in tasks if t.get("status") != "Concluído"]

    def _normalize(text: str) -> set:
        stop = {"a", "o", "e", "de", "do", "da", "para", "com", "em", "no", "na", "um", "uma"}
        words = re.sub(r"[^\w\s]", "", text.lower()).split()
        return {w for w in words if w not in stop and len(w) > 2}

    groups = []
    visited = set()

    for i, t1 in enumerate(open_tasks):
        if t1["id"] in visited:
            continue
        words1 = _normalize(t1.get("title", ""))
        similar = []

        for j, t2 in enumerate(open_tasks):
            if i == j or t2["id"] in visited:
                continue
            words2 = _normalize(t2.get("title", ""))
            if not words1 or not words2:
                continue
            intersection = words1 & words2
            union = words1 | words2
            similarity = len(intersection) / len(union)

            if similarity >= 0.4:
                similar.append({
                    "id": t2["id"],
                    "title": t2.get("title"),
                    "status": t2.get("status"),
                    "assignee": t2.get("assignee"),
                    "similarity_score": round(similarity, 2),
                })
                visited.add(t2["id"])

        if similar:
            visited.add(t1["id"])
            groups.append({
                "primary_task": {"id": t1["id"], "title": t1.get("title"), "status": t1.get("status"), "assignee": t1.get("assignee")},
                "similar_tasks": similar,
                "suggestion": "Avaliar merge em uma única tarefa ou excluir a duplicata",
            })

    return {
        "total_open_tasks_analyzed": len(open_tasks),
        "duplicate_groups_found": len(groups),
        "groups": groups,
    }


@mcp.tool()
@require_auth
def analyze_team_workload() -> dict:
    """
    Por membro da equipe: tarefas abertas, tarefas atrasadas, distribuição
    por prioridade e grupo. Identifica quem está sobrecarregado.

    Returns:
        Workload de cada membro com score de carga e alertas
    """
    sb = _get_supabase()
    if not sb:
        return {"error": "Supabase não configurado"}

    tasks = _fetch_tasks(sb)
    today = date.today()
    members = ["Arthur", "Yasmim", "Alexandre", "Nikolas"]
    report = {}

    for member in members:
        member_tasks = [t for t in tasks if t.get("assignee") == member]
        open_tasks = [t for t in member_tasks if t.get("status") != "Concluído"]
        done_tasks = [t for t in member_tasks if t.get("status") == "Concluído"]

        overdue = []
        for t in open_tasks:
            due = t.get("due_date")
            if due:
                try:
                    due_date = date.fromisoformat(str(due)[:10])
                    if due_date < today:
                        overdue.append({"title": t.get("title"), "due_date": str(due), "status": t.get("status")})
                except ValueError:
                    pass

        priority_dist = {"Crítica": 0, "Alta": 0, "Média": 0, "Baixa": 0}
        for t in open_tasks:
            p = t.get("priority", "Média")
            if p in priority_dist:
                priority_dist[p] += 1

        # Score de carga: tarefas abertas × peso + atrasadas × 2 + críticas × 1.5
        load_score = (
            len(open_tasks) * 1.0
            + len(overdue) * 2.0
            + priority_dist.get("Crítica", 0) * 1.5
            + priority_dist.get("Alta", 0) * 0.5
        )

        alert = None
        if len(overdue) >= 3:
            alert = f"ALERTA: {len(overdue)} tarefas atrasadas — risco de bloqueio"
        elif load_score > 15:
            alert = "ALERTA: carga de trabalho muito alta"
        elif load_score > 10:
            alert = "Atenção: carga elevada"

        report[member] = {
            "open_tasks": len(open_tasks),
            "overdue_tasks": len(overdue),
            "completed_tasks": len(done_tasks),
            "priority_distribution": priority_dist,
            "load_score": round(load_score, 1),
            "overdue_details": overdue,
            "alert": alert,
        }

    most_loaded = max(report, key=lambda m: report[m]["load_score"])
    least_loaded = min(report, key=lambda m: report[m]["load_score"])

    return {
        "team_workload": report,
        "most_loaded_member": most_loaded,
        "least_loaded_member": least_loaded,
        "total_open_tasks": sum(r["open_tasks"] for r in report.values()),
        "total_overdue_tasks": sum(r["overdue_tasks"] for r in report.values()),
        "generated_at": _today_str(),
    }


@mcp.tool()
@require_auth
def suggest_daily_focus(assignee: str) -> dict:
    """
    Para um membro da equipe, retorna as 3–5 tarefas que ele deve focar hoje,
    rankeadas por urgência × impacto.

    Args:
        assignee: Nome do membro (Arthur, Yasmim, Alexandre, Nikolas)

    Returns:
        Lista priorizada de tarefas com justificativa de cada uma
    """
    valid_members = {"Arthur", "Yasmim", "Alexandre", "Nikolas"}
    if assignee not in valid_members:
        return {"error": f"Membro inválido. Use: {', '.join(sorted(valid_members))}"}

    sb = _get_supabase()
    if not sb:
        return {"error": "Supabase não configurado"}

    tasks = _fetch_tasks(sb)
    today = date.today()
    my_tasks = [t for t in tasks if t.get("assignee") == assignee and t.get("status") != "Concluído"]

    priority_weight = {"Crítica": 4, "Alta": 3, "Média": 2, "Baixa": 1}
    status_weight = {"Em Andamento": 3, "Revisão": 2, "Pendente": 1}

    scored = []
    for t in my_tasks:
        score = 0
        reasons = []

        # Prioridade
        p_weight = priority_weight.get(t.get("priority", "Média"), 2)
        score += p_weight * 10
        if p_weight >= 3:
            reasons.append(f"prioridade {t.get('priority')}")

        # Status em andamento vale mais (não interromper fluxo)
        s_weight = status_weight.get(t.get("status", "Pendente"), 1)
        score += s_weight * 5
        if t.get("status") == "Em Andamento":
            reasons.append("já em andamento")

        # Atraso
        due = t.get("due_date")
        if due:
            try:
                due_date = date.fromisoformat(str(due)[:10])
                days_left = (due_date - today).days
                if days_left < 0:
                    score += 30
                    reasons.append(f"atrasada há {abs(days_left)} dia(s)")
                elif days_left == 0:
                    score += 25
                    reasons.append("vence hoje")
                elif days_left <= 2:
                    score += 15
                    reasons.append(f"vence em {days_left} dia(s)")
            except ValueError:
                pass

        scored.append({**t, "_score": score, "_reasons": reasons})

    scored.sort(key=lambda t: t["_score"], reverse=True)
    focus = scored[:5]

    return {
        "assignee": assignee,
        "focus_date": _today_str(),
        "tasks_to_focus": [
            {
                "rank": i + 1,
                "id": t["id"],
                "title": t.get("title"),
                "status": t.get("status"),
                "priority": t.get("priority"),
                "due_date": t.get("due_date"),
                "focus_score": t["_score"],
                "why_focus_now": t["_reasons"] or ["tarefa aberta sem urgência imediata"],
            }
            for i, t in enumerate(focus)
        ],
        "total_open_tasks": len(my_tasks),
        "tasks_not_shown": max(0, len(my_tasks) - 5),
    }


# ---------------------------------------------------------------------------
# TOOLS — Código e Sistema
# ---------------------------------------------------------------------------

# Diretórios onde escrita é permitida (relativo ao PROJECT_ROOT)
_WRITABLE_ROOTS = ("src", "mcp_server")

# Diretório de backups
_BACKUP_DIR = pathlib.Path(__file__).parent / "backups"
_BACKUP_DIR.mkdir(exist_ok=True)


@mcp.tool()
def write_file(file_path: str, new_content: str, reason: str) -> str:
    """
    Escreve conteúdo em um arquivo do projeto com backup automático e diff.

    Args:
        file_path: Caminho relativo ao root do projeto (somente src/ ou mcp_server/)
        new_content: Conteúdo completo novo do arquivo
        reason: Motivo da alteração (mínimo 10 caracteres)

    Returns:
        Relatório com diff unificado, caminho do backup e linhas alteradas.
        Em caso de erro na escrita, o backup é restaurado automaticamente.
    """
    # 1. Validação do motivo
    if len(reason.strip()) < 10:
        return "Erro de validação: 'reason' deve ter no mínimo 10 caracteres."

    # 2. Validação e resolução do caminho
    try:
        resolved = _validate_path(file_path)
    except ValueError as e:
        return f"Erro de segurança: {e}"

    # 3. Restringe escrita a src/ e mcp_server/ apenas
    relative_parts = resolved.relative_to(PROJECT_ROOT).parts
    if not relative_parts or relative_parts[0] not in _WRITABLE_ROOTS:
        allowed = ", ".join(f"'{r}/'" for r in _WRITABLE_ROOTS)
        return (
            f"Erro de segurança: escrita permitida apenas em {allowed}. "
            f"Caminho '{file_path}' está fora dessas áreas."
        )

    # 4. Lê conteúdo atual (se o arquivo existir)
    original_content = ""
    if resolved.is_file():
        try:
            original_content = resolved.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            return f"Erro ao ler arquivo original: {e}"

    # 5. Gera diff unificado
    original_lines = original_content.splitlines(keepends=True)
    new_lines = new_content.splitlines(keepends=True)
    diff_lines = list(difflib.unified_diff(
        original_lines,
        new_lines,
        fromfile=f"a/{file_path}",
        tofile=f"b/{file_path}",
    ))
    diff_text = "".join(diff_lines) if diff_lines else "(sem alterações de conteúdo)"

    changed_lines = sum(1 for l in diff_lines if l.startswith(("+", "-")) and not l.startswith(("+++", "---")))

    # 6. Salva backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = _BACKUP_DIR / f"{timestamp}_{resolved.name}.bak"
    if original_content:
        try:
            backup_path.write_text(original_content, encoding="utf-8")
        except Exception as e:
            return f"Erro ao criar backup: {e}"

    # 7. Escreve novo conteúdo (com restauração automática em caso de falha)
    try:
        resolved.parent.mkdir(parents=True, exist_ok=True)
        resolved.write_text(new_content, encoding="utf-8")
    except Exception as e:
        if original_content and backup_path.exists():
            try:
                resolved.write_text(original_content, encoding="utf-8")
            except Exception:
                pass
        return f"Erro ao escrever arquivo (backup restaurado): {e}"

    # 8. Relatório
    _ARQUIVOS_CRITICOS = [
        "src/app/App.tsx",
        "src/lib/supabase.ts",
        "mcp_server/server.py",
        "mcp_server/start.py",
        "mcp_server/tests/test_tools.py",
    ]
    critical_warning = (
        "\n⚠️ ARQUIVO CRÍTICO — confirme a aplicação revisando o diff acima antes de prosseguir."
        if file_path in _ARQUIVOS_CRITICOS else ""
    )

    backup_info = str(backup_path) if original_content else "(arquivo novo — sem backup necessário)"
    return (
        f"✅ Arquivo atualizado: {file_path}\n"
        f"📋 Motivo: {reason}\n"
        f"📦 Backup: {backup_info}\n"
        f"📊 Linhas alteradas: {changed_lines}\n\n"
        f"--- Diff ---\n{diff_text}"
        f"{critical_warning}"
    )


@mcp.tool()
def list_backups() -> str:
    """
    Lista todos os backups criados pela tool write_file.

    Returns:
        JSON com nome do arquivo, data de criação e tamanho de cada backup.
    """
    baks = sorted(_BACKUP_DIR.glob("*.bak"), key=lambda p: p.stat().st_mtime, reverse=True)
    entries = []
    for bak in baks:
        stat = bak.stat()
        entries.append({
            "filename": bak.name,
            "size_bytes": stat.st_size,
            "created_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
        })
    return json.dumps({
        "total_backups": len(entries),
        "backup_dir": str(_BACKUP_DIR),
        "backups": entries,
    }, indent=2, ensure_ascii=False)


@mcp.tool()
def restore_backup(backup_filename: str) -> str:
    """
    Restaura um arquivo a partir de um backup salvo em mcp_server/backups/.

    Args:
        backup_filename: Nome do arquivo .bak (ex: 20260425_143022_App.tsx.bak)

    Returns:
        Confirmação com caminho do arquivo restaurado, ou mensagem de erro.
    """
    # 1. Valida existência do backup
    backup_path = _BACKUP_DIR / backup_filename
    if not backup_path.exists():
        return f"Erro: backup '{backup_filename}' não encontrado em {_BACKUP_DIR}."
    if not backup_filename.endswith(".bak"):
        return "Erro: o arquivo deve ter extensão .bak."

    # 2. Extrai o nome original: formato {timestamp}_{original_name}.bak
    # Ex: 20260425_143022_App.tsx.bak → App.tsx
    parts = backup_filename[:-4].split("_", 2)  # remove .bak, split em até 3 partes
    if len(parts) < 3:
        return f"Erro: nome de backup inválido '{backup_filename}'. Formato esperado: YYYYMMDD_HHMMSS_arquivo.ext.bak"
    original_name = parts[2]  # tudo após timestamp_hora_

    # 3. Localiza o arquivo original em src/ ou mcp_server/
    target_path: pathlib.Path | None = None
    for root_name in _WRITABLE_ROOTS:
        candidate = PROJECT_ROOT / root_name
        for found in candidate.rglob(original_name):
            target_path = found
            break
        if target_path:
            break

    if target_path is None:
        return (
            f"Erro: arquivo original '{original_name}' não encontrado em "
            f"{[str(PROJECT_ROOT / r) for r in _WRITABLE_ROOTS]}. "
            "Restauração cancelada — verifique se o arquivo ainda existe no projeto."
        )

    # 4. Lê o backup e sobrescreve o original
    try:
        backup_content = backup_path.read_text(encoding="utf-8", errors="replace")
        target_path.write_text(backup_content, encoding="utf-8")
    except Exception as e:
        return f"Erro ao restaurar backup: {e}"

    return (
        f"✅ Restauração concluída.\n"
        f"📦 Backup usado: {backup_filename}\n"
        f"📄 Arquivo restaurado: {target_path.relative_to(PROJECT_ROOT)}\n"
        f"📊 Tamanho restaurado: {len(backup_content)} bytes"
    )


@mcp.tool()
def create_feature_end_to_end(feature_description: str, assignee: str = "Arthur") -> dict:
    """
    Recebe descrição de uma feature em português e entrega um plano completo:
    SQL de migração Supabase, esqueleto do componente React, tarefa criada
    no banco com subtarefas e lista de arquivos a modificar.

    Args:
        feature_description: Descrição da feature em linguagem natural
        assignee: Responsável pela implementação (padrão: Arthur)

    Returns:
        Plano end-to-end: SQL, componente React, tarefa criada, diff de arquivos
    """
    triage = ai_triage_task(feature_description)
    subtasks_data = generate_subtasks(feature_description)

    # Nomeia o componente a partir da descrição
    words = re.sub(r"[^\w\s]", "", feature_description).split()
    component_name = "".join(w.capitalize() for w in words[:3] if len(w) > 2)
    if not component_name:
        component_name = "NewFeature"

    sql_template = f"""-- Migration: add_{component_name.lower()}_support
-- Data: {_today_str()}
-- Descrição: {feature_description}

-- 1. Criar tabela (ajustar conforme necessidade)
-- CREATE TABLE {component_name.lower()}s (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
--   created_by TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- 2. Habilitar RLS
-- ALTER TABLE {component_name.lower()}s ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all_{component_name.lower()}s"
--   ON {component_name.lower()}s FOR ALL USING (true) WITH CHECK (true);

-- 3. Index de performance
-- CREATE INDEX idx_{component_name.lower()}s_task_id ON {component_name.lower()}s(task_id);
"""

    react_template = f"""// {component_name}.tsx
// Gerado automaticamente — ajustar conforme necessidade
import {{ useState, useEffect }} from 'react';
import {{ useTasksContext }} from '../../lib/TasksContext';
import {{ db }} from '../../lib/supabase';

interface {component_name}Props {{
  // Definir props necessárias
}}

export function {component_name}({{ }}: {component_name}Props) {{
  const {{ tasks }} = useTasksContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {{
    // Buscar dados necessários
  }}, []);

  if (loading) return <div className="flex items-center justify-center p-8">Carregando...</div>;
  if (error) return <div className="text-red-500 p-4">{{error}}</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">{feature_description}</h2>
      {{/* Implementar UI aqui */}}
    </div>
  );
}}
"""

    files_to_modify = [
        {"file": f"src/app/components/{component_name}.tsx", "action": "CRIAR", "reason": "Novo componente"},
        {"file": "src/app/App.tsx", "action": "MODIFICAR", "reason": "Registrar nova rota/view"},
        {"file": "src/app/components/Sidebar.tsx", "action": "MODIFICAR", "reason": "Adicionar item de navegação"},
        {"file": "src/lib/supabase.ts", "action": "MODIFICAR", "reason": "Adicionar helpers de banco se necessário"},
    ]

    sb = _get_supabase()
    created_task_id = None
    if sb:
        try:
            task_payload = {
                "title": feature_description[:120],
                "description": f"Feature gerada via MCP. Componente: {component_name}",
                "status": "Pendente",
                "priority": triage["suggested_priority"],
                "group": triage["suggested_group"],
                "assignee": assignee,
                "tags": triage["suggested_tags"],
            }
            res = sb.table("tasks").insert(task_payload).execute()
            if res.data:
                task_id = res.data[0]["id"]
                created_task_id = task_id
                subtask_rows = [
                    {"task_id": task_id, "title": s["title"], "completed": False}
                    for s in subtasks_data["subtasks"]
                ]
                sb.table("subtasks").insert(subtask_rows).execute()
        except Exception as e:
            created_task_id = f"Erro ao criar no Supabase: {e}"

    return {
        "feature": feature_description,
        "component_name": component_name,
        "assignee": assignee,
        "task_created_id": created_task_id,
        "triage": triage,
        "subtasks": subtasks_data["subtasks"],
        "sql_migration": sql_template,
        "react_skeleton": react_template,
        "files_to_modify": files_to_modify,
        "estimated_hours": subtasks_data["total_estimated_hours"],
    }


@mcp.tool()
def write_code_improvement(file_path: str, issue_description: str) -> dict:
    """
    Lê um arquivo do projeto, entende o problema descrito e retorna análise
    estruturada com o conteúdo atual e instruções precisas para o agente
    gerar o código corrigido.

    Args:
        file_path: Caminho relativo ao root (ex: 'src/app/components/Dashboard.tsx')
        issue_description: Descrição do problema ou melhoria em português

    Returns:
        Conteúdo atual do arquivo + análise do problema + checklist de mudanças
    """
    content = read_file(file_path)
    if content.startswith("Erro") or content.startswith("Arquivo não"):
        return {"error": content}

    lines = content.splitlines()
    size_kb = round(len(content) / 1024, 1)

    # Detecta padrões problemáticos no código
    issues_found = []
    if "any" in content and "TypeScript" not in issue_description.lower():
        count = content.count(": any")
        if count > 0:
            issues_found.append(f"{count} uso(s) de 'any' — tipagem fraca")
    if "console.log" in content:
        issues_found.append("console.log em produção")
    if content.count("useState") > 8:
        issues_found.append(f"Muitos useState ({content.count('useState')}) — considerar useReducer ou Context")
    if "// TODO" in content or "// FIXME" in content:
        count = content.count("// TODO") + content.count("// FIXME")
        issues_found.append(f"{count} TODO/FIXME pendente(s)")

    return {
        "file_path": file_path,
        "issue_to_fix": issue_description,
        "file_stats": {
            "lines": len(lines),
            "size_kb": size_kb,
        },
        "auto_detected_issues": issues_found,
        "current_content": content[:12000],
        "truncated": len(content) > 12000,
        "instructions_for_agent": (
            f"Analise o arquivo '{file_path}' acima. "
            f"Problema reportado: '{issue_description}'. "
            f"Problemas detectados automaticamente: {issues_found or 'nenhum'}. "
            "Gere o arquivo completo corrigido, mantendo toda a funcionalidade existente. "
            "Retorne APENAS o código, sem explicações adicionais."
        ),
    }


@mcp.tool()
def generate_test_suite(component_path: str) -> dict:
    """
    Gera arquivo .test.tsx completo com Vitest + React Testing Library
    para um componente do EasyTask. Inclui mocks de Supabase e TasksContext.

    Args:
        component_path: Caminho relativo (ex: 'src/app/components/Dashboard.tsx')

    Returns:
        Conteúdo do arquivo de teste pronto para salvar
    """
    content = read_file(component_path)
    if content.startswith("Erro") or content.startswith("Arquivo não"):
        return {"error": content}

    # Extrai nome do componente e imports
    component_name_match = re.search(r"export (?:default )?function (\w+)", content)
    component_name = component_name_match.group(1) if component_name_match else "Component"

    uses_context = "useTasksContext" in content or "TasksContext" in content
    uses_supabase = "supabase" in content.lower() or "db." in content
    has_loading = "loading" in content.lower()
    has_error = "error" in content.lower()

    context_mock = ""
    if uses_context:
        context_mock = """
vi.mock('../../lib/TasksContext', () => ({
  useTasksContext: () => ({
    tasks: mockTasks,
    workspaces: [],
    loading: false,
    error: null,
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    refreshTasks: vi.fn(),
  }),
}));"""

    supabase_mock = ""
    if uses_supabase:
        supabase_mock = """
vi.mock('../../lib/supabase', () => ({
  db: {
    tasks: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    workspaces: { getAll: vi.fn(), create: vi.fn() },
    comments: { getByTask: vi.fn(), create: vi.fn() },
    subtasks: { getByTask: vi.fn(), create: vi.fn(), toggle: vi.fn() },
  },
  supabase: { from: vi.fn() },
}));"""

    path_parts = component_path.replace("\\", "/").split("/")
    component_file = path_parts[-1]
    component_dir = "/".join(path_parts[:-1])
    test_path = f"{component_dir}/{component_name}.test.tsx"

    test_content = f"""import {{ describe, it, expect, vi, beforeEach }} from 'vitest';
import {{ render, screen, fireEvent, waitFor }} from '@testing-library/react';
import {{ {component_name} }} from './{component_name}';
{context_mock}
{supabase_mock}

const mockTasks = [
  {{
    id: 'task-1',
    title: 'Tarefa de teste',
    status: 'Pendente',
    priority: 'Alta',
    group: 'Operacional',
    assignee: 'Arthur',
    due_date: '{(date.today() + timedelta(days=3)).isoformat()}',
    tags: [],
    created_at: new Date().toISOString(),
  }},
  {{
    id: 'task-2',
    title: 'Tarefa concluída',
    status: 'Concluído',
    priority: 'Baixa',
    group: 'Desenvolvimento',
    assignee: 'Yasmim',
    due_date: null,
    tags: ['bug'],
    created_at: new Date().toISOString(),
  }},
];

describe('{component_name}', () => {{
  beforeEach(() => {{
    vi.clearAllMocks();
  }});

  it('deve renderizar sem erros', () => {{
    render(<{component_name} />);
    expect(document.body).toBeTruthy();
  }});
{"" if not has_loading else """
  it('deve exibir estado de loading', () => {
    render(<""" + component_name + """ />);
    // Verificar que loading state é exibido inicialmente
  });
"""}
{"" if not has_error else """
  it('deve exibir mensagem de erro quando há falha', async () => {
    render(<""" + component_name + """ />);
    // Simular erro e verificar exibição
  });
"""}
  it('deve exibir dados após carregar', async () => {{
    render(<{component_name} />);
    await waitFor(() => {{
      // Verificar elementos principais do componente
    }});
  }});

  it('deve responder a interações do usuário', async () => {{
    render(<{component_name} />);
    // Testar clicks, inputs e outros eventos
    // fireEvent.click(screen.getByRole('button', {{ name: /..../i }}));
  }});

  // TODO: adicionar testes específicos para cada funcionalidade
}});
"""

    return {
        "component": component_name,
        "test_file_path": test_path,
        "test_content": test_content,
        "mocks_included": {
            "tasks_context": uses_context,
            "supabase": uses_supabase,
        },
        "install_command": "pnpm add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom",
        "note": "Salve o conteúdo de 'test_content' no caminho 'test_file_path' para usar.",
    }


# ---------------------------------------------------------------------------
# TOOLS — Relatórios e Insights
# ---------------------------------------------------------------------------

@mcp.tool()
@require_auth
def generate_weekly_report(week_offset: int = 0) -> dict:
    """
    Relatório semanal completo: tarefas concluídas, atrasadas, velocidade
    por membro, bloqueios identificados. Pronto para copiar e enviar.

    Args:
        week_offset: 0 = semana atual, -1 = semana passada, etc.

    Returns:
        Relatório estruturado + versão texto formatada para WhatsApp/email
    """
    sb = _get_supabase()
    if not sb:
        return {"error": "Supabase não configurado"}

    today = date.today()
    week_start = today - timedelta(days=today.weekday()) + timedelta(weeks=week_offset)
    week_end = week_start + timedelta(days=6)

    tasks = _fetch_tasks(sb)
    members = ["Arthur", "Yasmim", "Alexandre", "Nikolas"]

    member_stats = {}
    for member in members:
        m_tasks = [t for t in tasks if t.get("assignee") == member]
        completed = [t for t in m_tasks if t.get("status") == "Concluído"]
        in_progress = [t for t in m_tasks if t.get("status") == "Em Andamento"]
        overdue = [
            t for t in m_tasks
            if t.get("status") != "Concluído" and t.get("due_date")
            and date.fromisoformat(str(t["due_date"])[:10]) < today
        ]
        member_stats[member] = {
            "completed": len(completed),
            "in_progress": len(in_progress),
            "overdue": len(overdue),
            "overdue_titles": [t.get("title") for t in overdue[:3]],
        }

    total_completed = sum(s["completed"] for s in member_stats.values())
    total_overdue = sum(s["overdue"] for s in member_stats.values())
    open_tasks = [t for t in tasks if t.get("status") != "Concluído"]

    # Texto formatado para WhatsApp
    lines = [
        f"📊 *Relatório Semanal EasyTask*",
        f"📅 {week_start.strftime('%d/%m')} – {week_end.strftime('%d/%m/%Y')}",
        "",
        f"✅ Tarefas concluídas: {total_completed}",
        f"🔄 Em andamento: {len([t for t in tasks if t.get('status') == 'Em Andamento'])}",
        f"⏳ Pendentes: {len([t for t in tasks if t.get('status') == 'Pendente'])}",
        f"🔴 Atrasadas: {total_overdue}",
        "",
        "*Por membro:*",
    ]
    for member, stats in member_stats.items():
        emoji = "🟢" if stats["overdue"] == 0 else "🔴"
        lines.append(f"{emoji} {member}: {stats['completed']} concluídas | {stats['overdue']} atrasadas")
        for title in stats["overdue_titles"]:
            lines.append(f"   ⚠️ {title}")

    lines += ["", f"_Gerado em {today.strftime('%d/%m/%Y às %H:%M')}_"]

    return {
        "period": {"start": str(week_start), "end": str(week_end)},
        "summary": {
            "total_completed": total_completed,
            "total_overdue": total_overdue,
            "total_open": len(open_tasks),
        },
        "member_stats": member_stats,
        "whatsapp_text": "\n".join(lines),
        "generated_at": _today_str(),
    }


@mcp.tool()
@require_auth
def generate_standup(assignee: str) -> dict:
    """
    Gera pauta de daily standup para um membro baseado nas tarefas reais
    do Supabase: o que fez, o que fará hoje, impedimentos.

    Args:
        assignee: Nome do membro (Arthur, Yasmim, Alexandre, Nikolas)

    Returns:
        Pauta estruturada + texto pronto para colar no WhatsApp/Slack
    """
    valid_members = {"Arthur", "Yasmim", "Alexandre", "Nikolas"}
    if assignee not in valid_members:
        return {"error": f"Membro inválido. Use: {', '.join(sorted(valid_members))}"}

    sb = _get_supabase()
    if not sb:
        return {"error": "Supabase não configurado"}

    tasks = _fetch_tasks(sb)
    today = date.today()
    yesterday = today - timedelta(days=1)
    my_tasks = [t for t in tasks if t.get("assignee") == assignee]

    done_recently = [
        t for t in my_tasks
        if t.get("status") == "Concluído" and t.get("updated_at")
        and date.fromisoformat(str(t["updated_at"])[:10]) >= yesterday
    ]
    in_progress = [t for t in my_tasks if t.get("status") == "Em Andamento"]
    focus_data = suggest_daily_focus(assignee)
    today_tasks = focus_data.get("tasks_to_focus", [])[:3]

    overdue = [
        t for t in my_tasks
        if t.get("status") != "Concluído" and t.get("due_date")
        and date.fromisoformat(str(t["due_date"])[:10]) < today
    ]

    impediments = []
    if overdue:
        impediments.append(f"{len(overdue)} tarefa(s) atrasada(s) precisando de atenção")
    if not in_progress and not today_tasks:
        impediments.append("Sem tarefas prioritárias definidas para hoje")

    # Texto formatado
    lines = [
        f"🗣️ *Daily Standup — {assignee}*",
        f"📅 {today.strftime('%d/%m/%Y')}",
        "",
        "✅ *O que fiz ontem:*",
    ]
    if done_recently:
        for t in done_recently[:3]:
            lines.append(f"  • {t.get('title')}")
    else:
        for t in in_progress[:2]:
            lines.append(f"  • Trabalhei em: {t.get('title')}")
        if not in_progress:
            lines.append("  • (sem tarefas concluídas recentemente registradas)")

    lines += ["", "🎯 *O que farei hoje:*"]
    for t in today_tasks:
        lines.append(f"  • {t['title']} [{t['priority']}]")
    if not today_tasks:
        lines.append("  • (definir prioridades)")

    lines += ["", "🚧 *Impedimentos:*"]
    if impediments:
        for imp in impediments:
            lines.append(f"  ⚠️ {imp}")
    else:
        lines.append("  ✅ Nenhum impedimento")

    return {
        "assignee": assignee,
        "date": _today_str(),
        "done_yesterday": [t.get("title") for t in done_recently],
        "focus_today": [t["title"] for t in today_tasks],
        "impediments": impediments,
        "standup_text": "\n".join(lines),
    }


@mcp.tool()
@require_auth
def predict_sprint_completion(sprint_end_date: str) -> dict:
    """
    Analisa tarefas abertas vs histórico da equipe e prediz quais tarefas
    NÃO serão entregues até a data informada.

    Args:
        sprint_end_date: Data fim do sprint em formato YYYY-MM-DD

    Returns:
        Previsão de entrega, tarefas em risco e recomendações
    """
    try:
        end_date = date.fromisoformat(sprint_end_date)
    except ValueError:
        return {"error": "Data inválida. Use formato YYYY-MM-DD (ex: 2026-05-02)"}

    sb = _get_supabase()
    if not sb:
        return {"error": "Supabase não configurado"}

    tasks = _fetch_tasks(sb)
    today = date.today()
    days_remaining = (end_date - today).days

    if days_remaining < 0:
        return {"error": "Data já passou"}

    open_tasks = [t for t in tasks if t.get("status") not in ("Concluído",)]
    in_progress = [t for t in open_tasks if t.get("status") == "Em Andamento"]
    pending = [t for t in open_tasks if t.get("status") == "Pendente"]
    review = [t for t in open_tasks if t.get("status") == "Revisão"]

    # Velocidade estimada: histórico simples (tarefas concluídas / dias)
    done_tasks = [t for t in tasks if t.get("status") == "Concluído"]
    # Assume velocidade de 2 tarefas/dia para a equipe (heurística)
    team_velocity = max(1, len(done_tasks) // max(1, (today - date(2026, 4, 1)).days)) if done_tasks else 2
    capacity = team_velocity * days_remaining

    priority_weight = {"Crítica": 4, "Alta": 3, "Média": 2, "Baixa": 1}
    sorted_open = sorted(open_tasks, key=lambda t: priority_weight.get(t.get("priority", "Média"), 2), reverse=True)

    likely_done = sorted_open[:int(capacity)]
    at_risk = sorted_open[int(capacity):]

    overdue_in_sprint = [
        t for t in open_tasks
        if t.get("due_date") and date.fromisoformat(str(t["due_date"])[:10]) <= end_date
    ]

    recommendations = []
    if len(at_risk) > 0:
        recommendations.append(f"Reduzir escopo: mover {len(at_risk)} tarefa(s) de baixa prioridade para próximo sprint")
    if len([t for t in open_tasks if t.get("priority") == "Crítica"]) > 3:
        recommendations.append("Muitas tarefas críticas abertas — revisar o que realmente é crítico")
    if days_remaining <= 2 and len(pending) > 5:
        recommendations.append("Sprint ending soon: focar só em 'Em Andamento' e 'Revisão'")

    return {
        "sprint_end_date": sprint_end_date,
        "days_remaining": days_remaining,
        "team_velocity_per_day": round(team_velocity, 1),
        "estimated_capacity": int(capacity),
        "open_tasks_count": len(open_tasks),
        "status_breakdown": {
            "in_progress": len(in_progress),
            "review": len(review),
            "pending": len(pending),
        },
        "likely_completed": [{"title": t.get("title"), "priority": t.get("priority")} for t in likely_done[:10]],
        "at_risk": [{"title": t.get("title"), "priority": t.get("priority"), "assignee": t.get("assignee")} for t in at_risk[:10]],
        "overdue_within_sprint": len(overdue_in_sprint),
        "completion_probability": f"{min(100, round(capacity / max(1, len(open_tasks)) * 100))}%",
        "recommendations": recommendations,
    }


@mcp.tool()
@require_auth
def detect_bottlenecks() -> dict:
    """
    Identifica tarefas paradas há muitos dias, gargalos por status,
    e membros potencialmente bloqueando outros.

    Returns:
        Lista de gargalos identificados com severidade e sugestão de ação
    """
    sb = _get_supabase()
    if not sb:
        return {"error": "Supabase não configurado"}

    tasks = _fetch_tasks(sb)
    today = date.today()
    bottlenecks = []

    # Tarefas em Revisão há muito tempo (bloqueiam quem está esperando feedback)
    review_tasks = [t for t in tasks if t.get("status") == "Revisão"]
    for t in review_tasks:
        updated = t.get("updated_at") or t.get("created_at")
        if updated:
            try:
                days_in_review = (today - date.fromisoformat(str(updated)[:10])).days
                if days_in_review >= 2:
                    bottlenecks.append({
                        "type": "REVISÃO LONGA",
                        "severity": "Alta" if days_in_review >= 5 else "Média",
                        "task_id": t["id"],
                        "task_title": t.get("title"),
                        "assignee": t.get("assignee"),
                        "days_stuck": days_in_review,
                        "action": f"Tarefa em revisão há {days_in_review} dia(s) — necessita feedback ou aprovação",
                    })
            except ValueError:
                pass

    # Tarefas atrasadas com alta prioridade
    for t in tasks:
        if t.get("status") == "Concluído":
            continue
        due = t.get("due_date")
        if not due:
            continue
        try:
            due_date = date.fromisoformat(str(due)[:10])
            days_late = (today - due_date).days
            if days_late > 0 and t.get("priority") in ("Crítica", "Alta"):
                bottlenecks.append({
                    "type": "ATRASO CRÍTICO",
                    "severity": "Crítica" if t.get("priority") == "Crítica" else "Alta",
                    "task_id": t["id"],
                    "task_title": t.get("title"),
                    "assignee": t.get("assignee"),
                    "days_stuck": days_late,
                    "action": f"Tarefa {t.get('priority')} atrasada {days_late} dia(s) — escalar ou redistribuir",
                })
        except ValueError:
            pass

    # Membro com muitas tarefas em andamento simultaneamente (context switching)
    members = ["Arthur", "Yasmim", "Alexandre", "Nikolas"]
    for member in members:
        in_progress = [t for t in tasks if t.get("assignee") == member and t.get("status") == "Em Andamento"]
        if len(in_progress) >= 4:
            bottlenecks.append({
                "type": "SOBRECARGA",
                "severity": "Alta",
                "task_id": None,
                "task_title": None,
                "assignee": member,
                "days_stuck": 0,
                "action": f"{member} tem {len(in_progress)} tarefas em andamento simultaneamente — foco em 1–2 por vez",
            })

    bottlenecks.sort(key=lambda b: {"Crítica": 3, "Alta": 2, "Média": 1}.get(b["severity"], 0), reverse=True)

    return {
        "bottlenecks_found": len(bottlenecks),
        "critical_count": len([b for b in bottlenecks if b["severity"] == "Crítica"]),
        "high_count": len([b for b in bottlenecks if b["severity"] == "Alta"]),
        "bottlenecks": bottlenecks,
        "analyzed_at": _today_str(),
    }


# ---------------------------------------------------------------------------
# TOOLS — Busca e Análise de Código
# ---------------------------------------------------------------------------

@mcp.tool()
def search_in_files(
    pattern: str,
    directory: str = "",
    file_extension: str = "",
    max_results: int = 50,
) -> str:
    """
    Busca por padrão regex em todos os arquivos do projeto.

    Args:
        pattern: Expressão regular para buscar (ex: "useState\\(", "supabase\\.")
        directory: Subdiretório para limitar a busca (vazio = projeto inteiro)
        file_extension: Filtrar por extensão (ex: ".tsx", ".ts") — vazio = todas permitidas
        max_results: Limite de resultados (padrão 50, máximo 200)

    Returns:
        JSON com total_matches, files_searched e lista de resultados com contexto.
    """
    import time

    # Validações de entrada
    if len(pattern) > 200:
        return json.dumps({"error": "Erro de validação: pattern excede 200 caracteres."})

    max_results = min(max_results, 200)

    # Compila o regex com timeout de segurança contra ReDoS
    try:
        t0 = time.monotonic()
        compiled = re.compile(pattern)
        elapsed = time.monotonic() - t0
        if elapsed > 1.0:
            return json.dumps({"error": "Erro de segurança: pattern demorou demais para compilar (possível ReDoS)."})
    except re.error as e:
        return json.dumps({"error": f"Erro de regex inválido: {e}"})

    # Resolve diretório base
    try:
        base = _validate_path(directory) if directory else PROJECT_ROOT
    except ValueError as e:
        return json.dumps({"error": f"Erro de segurança: {e}"})

    # Normaliza extensão
    ext_filter = file_extension.lower() if file_extension else ""
    if ext_filter and not ext_filter.startswith("."):
        ext_filter = f".{ext_filter}"

    results = []
    files_searched = 0

    for path in base.rglob("*"):
        if len(results) >= max_results:
            break

        # Pula diretórios proibidos
        if any(f in path.parts for f in FORBIDDEN_DIRS):
            continue
        if not path.is_file():
            continue
        if not _is_readable(path):
            continue
        if ext_filter and path.suffix.lower() != ext_filter:
            continue

        try:
            lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        except Exception:
            continue

        files_searched += 1

        for i, line in enumerate(lines):
            if len(results) >= max_results:
                break
            if compiled.search(line):
                # Contexto: 2 linhas antes e depois
                ctx_start = max(0, i - 2)
                ctx_end = min(len(lines), i + 3)
                context = [
                    {"line_number": ctx_start + j + 1, "content": lines[ctx_start + j]}
                    for j in range(ctx_end - ctx_start)
                    if ctx_start + j != i
                ]
                results.append({
                    "file": str(path.relative_to(PROJECT_ROOT)),
                    "line_number": i + 1,
                    "line_content": line,
                    "context": context,
                })

    return json.dumps({
        "pattern": pattern,
        "total_matches": len(results),
        "files_searched": files_searched,
        "max_results": max_results,
        "results": results,
    }, indent=2, ensure_ascii=False)


@mcp.tool()
def get_code_metrics() -> str:
    """
    Analisa o codebase e retorna métricas detalhadas do projeto.

    Returns:
        JSON com total_files, by_extension, largest_files, total_lines,
        total_size_bytes, typescript_ratio e summary formatado para README.
    """
    by_ext: dict[str, dict] = {}
    file_line_counts: list[dict] = []

    for path in PROJECT_ROOT.rglob("*"):
        if any(f in path.parts for f in FORBIDDEN_DIRS):
            continue
        try:
            if not path.is_file() or not _is_readable(path):
                continue
            size = path.stat().st_size
        except OSError:
            continue

        ext = path.suffix.lower() or ".other"
        try:
            content = path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue

        lines = content.count("\n") + (1 if content and not content.endswith("\n") else 0)

        if ext not in by_ext:
            by_ext[ext] = {"files": 0, "lines": 0, "size_bytes": 0}
        by_ext[ext]["files"] += 1
        by_ext[ext]["lines"] += lines
        by_ext[ext]["size_bytes"] += size

        file_line_counts.append({
            "path": str(path.relative_to(PROJECT_ROOT)),
            "lines": lines,
            "size_bytes": size,
        })

    total_files = sum(v["files"] for v in by_ext.values())
    total_lines = sum(v["lines"] for v in by_ext.values())
    total_size = sum(v["size_bytes"] for v in by_ext.values())

    ts_lines = sum(
        by_ext[e]["lines"] for e in (".ts", ".tsx") if e in by_ext
    )
    typescript_ratio = round(ts_lines / total_lines * 100, 1) if total_lines else 0.0

    largest_files = sorted(file_line_counts, key=lambda f: f["lines"], reverse=True)[:10]

    summary = (
        f"{total_files} arquivos · "
        f"{total_lines:,} linhas · "
        f"{typescript_ratio}% TypeScript"
    ).replace(",", ".")

    return json.dumps({
        "total_files": total_files,
        "total_lines": total_lines,
        "total_size_bytes": total_size,
        "typescript_ratio": typescript_ratio,
        "by_extension": by_ext,
        "largest_files": largest_files,
        "summary": summary,
    }, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# TOOLS — Automação e Linguagem Natural
# ---------------------------------------------------------------------------

@mcp.tool()
def create_automation_rule(trigger: str, action: str) -> dict:
    """
    Dado um trigger e uma ação em linguagem natural, gera o SQL completo
    de uma função + trigger PL/pgSQL para o Supabase.

    Args:
        trigger: Ex: 'quando status muda para Concluído'
        action: Ex: 'notificar o responsável pelo workspace'

    Returns:
        SQL do trigger, função PL/pgSQL e instruções de instalação
    """
    trigger_lower = trigger.lower()
    action_lower = action.lower()

    # Detecta evento do trigger
    if any(k in trigger_lower for k in ["status", "muda", "atualiza", "update"]):
        event = "UPDATE"
        condition_col = "status"
        if "concluído" in trigger_lower or "concluido" in trigger_lower:
            condition_val = "Concluído"
        elif "andamento" in trigger_lower:
            condition_val = "Em Andamento"
        elif "revisão" in trigger_lower or "revisao" in trigger_lower:
            condition_val = "Revisão"
        else:
            condition_val = "Concluído"
        when_clause = f"NEW.{condition_col} = '{condition_val}' AND OLD.{condition_col} != '{condition_val}'"
    elif any(k in trigger_lower for k in ["criar", "nova", "insert", "inserir"]):
        event = "INSERT"
        when_clause = "TRUE"
        condition_val = "insert"
    elif any(k in trigger_lower for k in ["excluir", "deletar", "delete"]):
        event = "DELETE"
        when_clause = "TRUE"
        condition_val = "delete"
    else:
        event = "UPDATE"
        when_clause = "TRUE"
        condition_val = "any_change"

    func_name = re.sub(r"[^\w]", "_", f"fn_{trigger_lower[:30]}").lower().strip("_")
    trigger_name = re.sub(r"[^\w]", "_", f"trg_{trigger_lower[:25]}").lower().strip("_")

    sql = f"""-- ============================================================
-- Automação: {trigger} → {action}
-- Gerado em: {_today_str()}
-- ============================================================

-- 1. Função PL/pgSQL
CREATE OR REPLACE FUNCTION {func_name}()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_assignee   TEXT;
BEGIN
  v_task_title := COALESCE(NEW.title, OLD.title, '(sem título)');
  v_assignee   := COALESCE(NEW.assignee, OLD.assignee, 'equipe');

  -- Ação: {action}
  -- Registra no log de automações (tabela automation_logs deve existir)
  INSERT INTO automation_logs (event_type, task_id, task_title, triggered_by, message, created_at)
  VALUES (
    '{event}_{condition_val}',
    COALESCE(NEW.id, OLD.id),
    v_task_title,
    v_assignee,
    'Automação disparada: {trigger} → {action}',
    NOW()
  );

  -- TODO: adicionar notificação real (ex: via pg_notify, webhook, etc.)
  -- PERFORM pg_notify('task_events', json_build_object(
  --   'type', '{event}_{condition_val}',
  --   'task_id', NEW.id,
  --   'assignee', v_assignee
  -- )::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger na tabela tasks
DROP TRIGGER IF EXISTS {trigger_name} ON tasks;
CREATE TRIGGER {trigger_name}
  AFTER {event} ON tasks
  FOR EACH ROW
  WHEN ({when_clause})
  EXECUTE FUNCTION {func_name}();

-- 3. Tabela de log (criar se não existir)
CREATE TABLE IF NOT EXISTS automation_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT NOT NULL,
  task_id      UUID,
  task_title   TEXT,
  triggered_by TEXT,
  message      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
"""

    return {
        "trigger_description": trigger,
        "action_description": action,
        "detected_event": event,
        "sql": sql,
        "how_to_install": [
            "1. Acesse o Supabase Dashboard → SQL Editor",
            "2. Cole e execute o SQL acima",
            "3. Verifique em Database → Triggers que o trigger foi criado",
            "4. Teste alterando o status de uma tarefa",
        ],
        "next_steps": "Para notificações reais, configure um Supabase Webhook ou Edge Function conectado ao Realtime.",
    }


@mcp.tool()
def ask_about_project(question: str) -> dict:
    """
    Chat em linguagem natural sobre o projeto. Responde perguntas sobre
    tarefas, membros, status, métricas e codebase combinando dados do
    Supabase com o contexto do código.

    Exemplos:
        'Quais tarefas do Alexandre estão atrasadas?'
        'Qual foi a produtividade da semana?'
        'Quem tem mais tarefas críticas abertas?'
        'Quantos componentes o projeto tem?'

    Args:
        question: Pergunta em linguagem natural sobre o projeto

    Returns:
        Dados relevantes + contexto para o agente formular a resposta
    """
    q = question.lower()
    context_data = {}
    used_sources = []

    # Roteamento por intenção
    needs_tasks = any(k in q for k in [
        "tarefa", "task", "atrasad", "concluíd", "pendente", "andamento",
        "prioridade", "critica", "alta", "workload", "carga", "semana",
        "produtiv", "velocidade", "standup", "gargalo", "bloqueio",
    ])
    needs_member = any(m.lower() in q for m in ["arthur", "yasmim", "alexandre", "nikolas"])
    needs_code = any(k in q for k in [
        "componente", "arquivo", "código", "linhas", "tela", "feature",
        "quantos", "quais telas", "stack", "tecnologia", "dependência",
    ])

    if needs_tasks:
        sb = _get_supabase()
        if sb:
            tasks = _fetch_tasks(sb)
            today = date.today()
            members = ["Arthur", "Yasmim", "Alexandre", "Nikolas"]

            # Filtra por membro se mencionado
            if needs_member:
                for m in members:
                    if m.lower() in q:
                        tasks = [t for t in tasks if t.get("assignee") == m]
                        context_data["filtered_member"] = m
                        break

            open_tasks = [t for t in tasks if t.get("status") != "Concluído"]
            overdue = [
                t for t in open_tasks
                if t.get("due_date") and date.fromisoformat(str(t["due_date"])[:10]) < today
            ]

            context_data["tasks_summary"] = {
                "total": len(tasks),
                "open": len(open_tasks),
                "completed": len([t for t in tasks if t.get("status") == "Concluído"]),
                "overdue": len(overdue),
                "by_status": {
                    s: len([t for t in open_tasks if t.get("status") == s])
                    for s in ["Pendente", "Em Andamento", "Revisão"]
                },
                "by_priority": {
                    p: len([t for t in open_tasks if t.get("priority") == p])
                    for p in ["Crítica", "Alta", "Média", "Baixa"]
                },
                "by_member": {
                    m: len([t for t in open_tasks if t.get("assignee") == m])
                    for m in members
                },
                "overdue_tasks": [
                    {"title": t.get("title"), "assignee": t.get("assignee"), "due_date": t.get("due_date")}
                    for t in overdue[:10]
                ],
            }
            used_sources.append("supabase:tasks")

    if needs_code:
        files = _walk_project(PROJECT_ROOT / "src")
        tsx_files = [f for f in files if f["extension"] in (".tsx", ".ts")]
        context_data["codebase_summary"] = {
            "total_files": len(files),
            "tsx_components": len(tsx_files),
            "top_components_by_size": sorted(tsx_files, key=lambda f: f["size_bytes"], reverse=True)[:5],
        }
        used_sources.append("codebase:src")

    if not context_data:
        context_data["project_context"] = get_project_context()
        used_sources.append("docs:project_context")

    return {
        "question": question,
        "data_sources_used": used_sources,
        "context": context_data,
        "instruction_for_agent": (
            f"Use os dados em 'context' para responder a pergunta: '{question}'. "
            "Responda em português, de forma direta e objetiva. "
            "Se os dados não forem suficientes, diga o que está faltando."
        ),
    }


# ---------------------------------------------------------------------------
# RESOURCES — Dados que o agente pode "subscrever"
# ---------------------------------------------------------------------------

@mcp.resource("easytask://src/{file_path}")
def get_source_file(file_path: str) -> str:
    """
    Resource para leitura direta de arquivos fonte.
    URI: easytask://src/app/components/Dashboard.tsx
    """
    return read_file(f"src/{file_path}")


@mcp.resource("easytask://schema")
def get_schema_resource() -> str:
    """
    Resource do schema completo do banco de dados.
    URI: easytask://schema
    """
    return get_db_schema()


@mcp.resource("easytask://docs")
def get_documentation() -> str:
    """
    Resource da documentação completa do projeto.
    URI: easytask://docs
    """
    return get_project_context()


@mcp.resource("easytask://config")
def get_config() -> str:
    """
    Resource dos arquivos de configuração (package.json, vite.config.ts, etc).
    URI: easytask://config
    """
    config_files = ["package.json", "vite.config.ts", "tsconfig.json", "tailwind.config.ts"]
    configs = []

    for file_name in config_files:
        content = read_file(file_name)
        if not content.startswith("Erro") and not content.startswith("Arquivo"):
            configs.append(f"### {file_name}\n```json\n{content[:2000]}\n```")

    return "\n\n".join(configs) if configs else "Arquivos de config não encontrados."


# ---------------------------------------------------------------------------
# PROMPTS — Templates reutilizáveis para análise
# ---------------------------------------------------------------------------

@mcp.prompt()
def review_component(component_name: str, component_path: str) -> str:
    """
    Template de prompt para revisão completa de um componente React.

    Args:
        component_name: Nome do componente (ex: 'Dashboard')
        component_path: Caminho relativo (ex: 'src/app/components/Dashboard.tsx')
    """
    return f"""
Você é um Engenheiro de Software Sênior especialista em React, TypeScript e sistemas similares ao Monday.com.

## Contexto
Projeto: EasyTask — sistema de gestão de tarefas para equipe de aluguel de imóveis.
Stack: React 18 + TypeScript + Tailwind CSS v4 + Supabase + Vite.

## Tarefa
Faça uma revisão completa do componente **{component_name}** em `{component_path}`.

## Checklist de revisão

### 1. Qualidade do código
- [ ] Tipagem TypeScript estrita (sem `any`, interfaces bem definidas)
- [ ] Componente seguindo princípio de responsabilidade única
- [ ] Props bem tipadas com `interface` ou `type`

### 2. Performance
- [ ] Uso adequado de `React.memo`, `useMemo`, `useCallback`
- [ ] Evita re-renders desnecessários
- [ ] Lazy loading onde aplicável

### 3. Padrão Monday.com
- [ ] Status coloridos e editáveis inline
- [ ] Transições e feedback visual suaves
- [ ] UX limpa sem poluição visual

### 4. Integração Supabase
- [ ] Queries otimizadas (sem N+1)
- [ ] Tratamento de erros e estados de loading
- [ ] Uso correto dos helpers em `src/lib/supabase.ts`

### 5. Acessibilidade
- [ ] Labels ARIA onde necessário
- [ ] Navegação por teclado funcional
- [ ] Contraste adequado

## Output esperado
Para cada problema encontrado, forneça:
1. Descrição do problema
2. Impacto (baixo/médio/alto)
3. Código de correção sugerido
"""


@mcp.prompt()
def suggest_feature(
    feature_name: str,
    feature_description: str,
) -> str:
    """
    Template para sugerir a implementação de uma nova feature.

    Args:
        feature_name: Nome da feature (ex: 'Automação de status')
        feature_description: Descrição do que a feature deve fazer
    """
    return f"""
Você é o Arquiteto Principal do EasyTask.

## Nova feature solicitada: {feature_name}

### Descrição
{feature_description}

## Análise sistêmica necessária

### 1. Impacto no banco de dados
Quais tabelas do Supabase precisam ser criadas ou alteradas?
Forneça o SQL de migração.

### 2. Novos componentes React
Quais componentes precisam ser criados?
Como eles se encaixam na arquitetura atual de `src/app/components/`?

### 3. Integração com o sistema de eventos
O EasyTask usa `CustomEvent API` para comunicação entre componentes.
Quais novos eventos precisam ser criados?

### 4. Automação sugerida (padrão Monday.com)
Proponha uma regra de automação: "Quando [gatilho], então [ação]".
Implemente usando hooks do React e triggers do Supabase.

### 5. Código base
Forneça o esqueleto do componente principal em TypeScript.

Stack: React 18 + TypeScript + Tailwind CSS v4 + Supabase
Cores: Primary #1E3A5F · Secondary #A8B4C0 · Background #F4F6F9
"""


@mcp.prompt()
def audit_security() -> str:
    """
    Template de prompt para auditoria de segurança do projeto.
    """
    return """
Você é um especialista em segurança web com foco em aplicações React + Supabase.

## Auditoria de segurança — EasyTask

Analise o codebase focando em:

### 1. Exposição de credenciais
- Variáveis de ambiente usadas corretamente (VITE_SUPABASE_* apenas no cliente)?
- Segredos presentes em arquivos commitados?

### 2. Row Level Security (RLS) do Supabase
- As tabelas `tasks`, `workspaces`, `comments`, `subtasks` têm RLS habilitado?
- As políticas são restritivas o suficiente?

### 3. Autenticação
- O sistema de login valida corretamente as credenciais?
- Existe proteção contra força bruta?
- Tokens de sessão são gerenciados de forma segura?

### 4. Input validation
- Inputs do usuário são sanitizados antes de ir ao banco?
- Existe proteção contra XSS nos campos de texto livre?

### 5. Exposição de dados sensíveis
- A API retorna apenas os campos necessários?
- Dados de outros usuários são inacessíveis?

Para cada vulnerabilidade encontrada, forneça:
- Severidade (crítica/alta/média/baixa)
- CVE ou padrão OWASP relacionado
- Correção recomendada com código
"""


@mcp.prompt()
def improve_ux(screen_name: str) -> str:
    """
    Template para melhorias de UX/UI baseadas no padrão Monday.com.

    Args:
        screen_name: Nome da tela (ex: 'Dashboard', 'TaskBoard', 'MyTasks')
    """
    return f"""
Você é um Designer de Produto especialista em ferramentas de produtividade tipo Monday.com.

## Análise de UX: tela **{screen_name}** do EasyTask

### Contexto
4 usuários internos (Arthur, Yasmim, Alexandre, Nikolas).
Objetivo: gestão de tarefas de uma plataforma de aluguel de curta temporada.
Cores: Navy #1E3A5F · Slate #A8B4C0 · Background #F4F6F9.

### Análise solicitada

#### 1. Princípios Monday.com aplicados
- Status com cores vivas e editáveis com um clique
- Edição inline (sem modais para operações simples)
- Feedback imediato (animações leves, toasts de confirmação)

#### 2. Problemas de UX identificados
Liste os principais friction points nessa tela.

#### 3. Melhorias sugeridas
Para cada melhoria:
- Descreva o comportamento atual vs. o comportamento ideal
- Forneça o componente React/Tailwind corrigido
- Indique o impacto na produtividade da equipe

#### 4. Micro-interações a adicionar
Sugestões de animações CSS/Framer Motion que melhoram a experiência
sem poluir a interface (princípio de UX limpa do EasyTask).

#### 5. Responsive design
O EasyTask tem responsividade limitada para mobile.
Priorize os ajustes mais impactantes para uso em smartphone.
"""


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    print(f"""
╔══════════════════════════════════════════════════╗
║          EasyTask MCP Server v1.0.0             ║
║                                                  ║
║  Project root : {str(PROJECT_ROOT)[:32]:<32} ║
║  Auth token   : {MCP_AUTH_TOKEN[:8]}...                      ║
║  Endpoint     : http://localhost:8000/mcp        ║
╚══════════════════════════════════════════════════╝

Tools disponíveis:
  • read_file(path)
  • list_components()
  • get_db_schema()
  • list_project_structure(directory)
  • get_project_context()
  • suggest_improvement(component_path, type)

Resources:
  • easytask://src/{{file_path}}
  • easytask://schema
  • easytask://docs
  • easytask://config

Prompts:
  • review_component
  • suggest_feature
  • audit_security
  • improve_ux
""")

    mcp.run()
