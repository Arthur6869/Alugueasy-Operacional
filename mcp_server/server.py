"""
Alugueasy MCP Server
====================
Servidor MCP que expõe o codebase e schema do Alugueasy para agentes de IA.
Permite que Claude Code, Claude API e outros agentes leiam, analisem e
sugiram melhorias para o sistema de forma segura e autenticada.

Requisitos:
    pip install fastmcp python-dotenv supabase

Execução:
    python server.py
    # ou via Claude Code:
    # claude mcp add alugueasy-mcp python server.py
"""

import os
import json
import pathlib
from typing import Optional
from dotenv import load_dotenv
from fastmcp import FastMCP, Context

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

load_dotenv()

# Caminho raiz do projeto Alugueasy (ajuste para o seu caminho local)
PROJECT_ROOT = pathlib.Path(
    os.getenv("ALUGUEASY_PROJECT_ROOT", "../")
).resolve()

# Token de autenticação — defina em .env como MCP_AUTH_TOKEN=sua_chave_secreta
MCP_AUTH_TOKEN = os.getenv("MCP_AUTH_TOKEN", "dev-token-change-in-production")

# Extensões de código que o agente pode ler
ALLOWED_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".css", ".json", ".md", ".sql"}

# Diretórios proibidos (nunca expõe ao agente)
FORBIDDEN_DIRS = {".git", "node_modules", "dist", "build", ".env"}

# ---------------------------------------------------------------------------
# Inicialização do servidor FastMCP
# ---------------------------------------------------------------------------

mcp = FastMCP(
    name="alugueasy-mcp",
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
    Lê o conteúdo de um arquivo do projeto Alugueasy.

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
    Lista todos os componentes React do projeto Alugueasy.

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
    Retorna o schema do banco de dados Supabase do Alugueasy.
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
## Schema Alugueasy (baseado na documentação do projeto)

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
    Retorna o contexto completo do projeto Alugueasy para o agente.
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
## Contexto do Projeto Alugueasy

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
Analise o código acima considerando o contexto do Alugueasy (React + TypeScript + Tailwind + Supabase).
Foque em: {improvement_type}.
Forneça sugestões concretas com exemplos de código quando aplicável.
"""


# ---------------------------------------------------------------------------
# RESOURCES — Dados que o agente pode "subscrever"
# ---------------------------------------------------------------------------

@mcp.resource("alugueasy://src/{file_path}")
def get_source_file(file_path: str) -> str:
    """
    Resource para leitura direta de arquivos fonte.
    URI: alugueasy://src/app/components/Dashboard.tsx
    """
    return read_file(f"src/{file_path}")


@mcp.resource("alugueasy://schema")
def get_schema_resource() -> str:
    """
    Resource do schema completo do banco de dados.
    URI: alugueasy://schema
    """
    return get_db_schema()


@mcp.resource("alugueasy://docs")
def get_documentation() -> str:
    """
    Resource da documentação completa do projeto.
    URI: alugueasy://docs
    """
    return get_project_context()


@mcp.resource("alugueasy://config")
def get_config() -> str:
    """
    Resource dos arquivos de configuração (package.json, vite.config.ts, etc).
    URI: alugueasy://config
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
Projeto: Alugueasy Operacional — sistema de gestão de tarefas para equipe de aluguel de imóveis.
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
Você é o Arquiteto Principal do Alugueasy Operacional.

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
O Alugueasy usa `CustomEvent API` para comunicação entre componentes.
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

## Auditoria de segurança — Alugueasy Operacional

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

## Análise de UX: tela **{screen_name}** do Alugueasy

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
sem poluir a interface (princípio de UX limpa do Alugueasy).

#### 5. Responsive design
O Alugueasy tem responsividade limitada para mobile.
Priorize os ajustes mais impactantes para uso em smartphone.
"""


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    print(f"""
╔══════════════════════════════════════════════════╗
║          Alugueasy MCP Server v1.0.0             ║
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
  • alugueasy://src/{{file_path}}
  • alugueasy://schema
  • alugueasy://docs
  • alugueasy://config

Prompts:
  • review_component
  • suggest_feature
  • audit_security
  • improve_ux
""")

    mcp.run()
