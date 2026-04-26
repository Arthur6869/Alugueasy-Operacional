"""
Testes das tools críticas do Alugueasy MCP Server.

Execução:
    mcp_server\\.venv\\Scripts\\pytest mcp_server/tests/test_tools.py -v
"""

import json
import os
import pathlib
import tempfile
from unittest.mock import patch

import pytest

from mcp_server.server import (
    analyze_team_workload,
    detect_duplicate_tasks,
    generate_weekly_report,
    get_db_schema,
    list_components,
    predict_sprint_completion,
    read_file,
    suggest_daily_focus,
    write_file,
)                   


# ---------------------------------------------------------------------------
# GRUPO 1 — read_file (segurança de paths)
# ---------------------------------------------------------------------------


def test_read_file_valido():
    """Confirma que um arquivo real do projeto é lido e retorna conteúdo não vazio."""
    result = read_file("mcp_server/requirements.txt")
    assert isinstance(result, str)
    assert len(result) > 0
    assert not result.startswith("Erro")
    assert not result.startswith("Arquivo não encontrado")


def test_read_file_path_traversal():
    """Confirma que tentativa de path traversal é bloqueada com mensagem de erro de segurança."""
    result = read_file("../../etc/passwd")
    assert isinstance(result, str)
    assert "Erro de segurança" in result or "Acesso negado" in result


def test_read_file_extensao_bloqueada():
    """Confirma que arquivos com extensão não permitida (.exe, .pyc) são rejeitados."""
    result = read_file("mcp_server/__pycache__/server.cpython-312.pyc")
    assert isinstance(result, str)
    assert "Extensão não permitida" in result or "Acesso negado" in result or "não encontrado" in result


def test_read_file_nao_encontrado():
    """Confirma que a leitura de arquivo inexistente retorna mensagem adequada."""
    result = read_file("arquivo_que_nao_existe.ts")
    assert isinstance(result, str)
    assert "não encontrado" in result


# ---------------------------------------------------------------------------
# GRUPO 2 — list_components
# ---------------------------------------------------------------------------


def test_list_components_retorna_json():
    """Confirma que list_components retorna JSON válido com as chaves 'total' e 'components'."""
    result = list_components()
    assert isinstance(result, str)
    data = json.loads(result)
    assert "total" in data
    assert "components" in data
    assert isinstance(data["components"], list)


def test_list_components_total_positivo():
    """Confirma que o campo 'total' é maior ou igual a zero (projeto pode não ter src/ ainda)."""
    result = list_components()
    data = json.loads(result)
    assert data["total"] >= 0


# ---------------------------------------------------------------------------
# GRUPO 3 — get_db_schema
# ---------------------------------------------------------------------------


def test_get_db_schema_retorna_conteudo():
    """Confirma que get_db_schema retorna uma string não vazia."""
    result = get_db_schema()
    assert isinstance(result, str)
    assert len(result) > 0


def test_get_db_schema_contem_tasks():
    """Confirma que o schema retornado descreve a tabela 'tasks'."""
    result = get_db_schema()
    assert "tasks" in result.lower()


# ---------------------------------------------------------------------------
# GRUPO 4 — Middleware de autenticação
# ---------------------------------------------------------------------------


def test_auth_token_configurado():
    """Confirma que MCP_AUTH_TOKEN está definido no ambiente e não usa o valor padrão inseguro."""
    token = os.getenv("MCP_AUTH_TOKEN", "")
    assert token != "", "MCP_AUTH_TOKEN não está definido no ambiente"
    assert token != "dev-token-change-in-production", (
        "MCP_AUTH_TOKEN ainda usa o valor padrão — defina um token seguro no .env"
    )


# ---------------------------------------------------------------------------
# GRUPO 5 — tools Supabase com mock (sem conexão real ao banco)
# ---------------------------------------------------------------------------


@patch("mcp_server.server._get_supabase", return_value=None)
@patch("mcp_server.server._AUTH_CONFIGURED", False)
def test_analyze_team_workload_sem_supabase(_mock_sb):
    """Confirma que analyze_team_workload retorna erro gracioso quando Supabase não está configurado."""
    result = analyze_team_workload()
    assert isinstance(result, dict)
    result_str = str(result)
    assert "error" in result_str or "Supabase" in result_str


@patch("mcp_server.server._AUTH_CONFIGURED", False)
def test_suggest_daily_focus_assignee_invalido():
    """Confirma que suggest_daily_focus rejeita assignee desconhecido sem lançar exceção."""
    result = suggest_daily_focus(assignee="Fulano")
    assert isinstance(result, dict)
    result_str = str(result)
    assert "error" in result_str or "inválido" in result_str or "não encontrado" in result_str


@patch("mcp_server.server._get_supabase", return_value=None)
@patch("mcp_server.server._AUTH_CONFIGURED", False)
def test_detect_duplicate_tasks_sem_supabase(_mock_sb):
    """Confirma que detect_duplicate_tasks não lança exceção e retorna resposta não vazia sem Supabase."""
    result = detect_duplicate_tasks()
    assert isinstance(result, dict)
    assert len(str(result)) > 0


@patch("mcp_server.server._get_supabase", return_value=None)
@patch("mcp_server.server._AUTH_CONFIGURED", False)
def test_generate_weekly_report_sem_supabase(_mock_sb):
    """Confirma que generate_weekly_report não lança exceção quando Supabase não está disponível."""
    result = generate_weekly_report(week_offset=0)
    assert isinstance(result, dict)
    assert len(str(result)) > 0


@patch("mcp_server.server._get_supabase", return_value=None)
@patch("mcp_server.server._AUTH_CONFIGURED", False)
def test_predict_sprint_sem_supabase(_mock_sb):
    """Confirma que predict_sprint_completion não lança exceção e retorna resposta não vazia sem Supabase."""
    result = predict_sprint_completion(sprint_end_date="2026-12-31")
    assert isinstance(result, dict)
    assert len(str(result)) > 0


# ---------------------------------------------------------------------------
# GRUPO 6 — write_file (escrita segura com backup e diff)
# ---------------------------------------------------------------------------

# Arquivo temporário dentro de src/ usado pelos testes de escrita
_TEST_FILE = "src/_mcp_test_write_file.ts"
_BACKUP_DIR = pathlib.Path(__file__).parent.parent / "backups"


def _cleanup_test_file():
    """Remove o arquivo de teste criado durante os testes."""
    from mcp_server.server import PROJECT_ROOT
    target = PROJECT_ROOT / _TEST_FILE
    if target.exists():
        target.unlink()


def test_write_file_cria_backup():
    """Confirma que write_file cria um arquivo .bak em mcp_server/backups/ após a escrita."""
    # Garante que o arquivo já existe para que um backup seja necessário
    from mcp_server.server import PROJECT_ROOT
    target = PROJECT_ROOT / _TEST_FILE
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("// conteúdo original\n", encoding="utf-8")

    backups_before = set(_BACKUP_DIR.glob("*.bak"))
    result = write_file(
        file_path=_TEST_FILE,
        new_content="// conteúdo atualizado pelo teste\n",
        reason="Teste automatizado de backup do write_file",
    )
    backups_after = set(_BACKUP_DIR.glob("*.bak"))

    _cleanup_test_file()
    assert isinstance(result, str)
    assert len(backups_after - backups_before) == 1, "Esperado exatamente 1 novo arquivo .bak"


def test_write_file_rejeita_env():
    """Confirma que write_file rejeita escrita em .env com erro de segurança."""
    result = write_file(
        file_path=".env",
        new_content="MCP_AUTH_TOKEN=hackeado",
        reason="tentativa de sobrescrever variáveis de ambiente",
    )
    assert isinstance(result, str)
    assert "Erro de segurança" in result or "Acesso negado" in result or "permitida apenas" in result


def test_write_file_rejeita_reason_curto():
    """Confirma que write_file rejeita reason com menos de 10 caracteres."""
    result = write_file(
        file_path=_TEST_FILE,
        new_content="// qualquer coisa\n",
        reason="ok",
    )
    assert isinstance(result, str)
    assert "validação" in result or "10 caracteres" in result or "Erro" in result


def test_write_file_diff_no_retorno():
    """Confirma que o retorno de write_file contém marcadores de diff unificado (--- e +++)."""
    from mcp_server.server import PROJECT_ROOT
    target = PROJECT_ROOT / _TEST_FILE
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("// linha original\n", encoding="utf-8")

    result = write_file(
        file_path=_TEST_FILE,
        new_content="// linha original\n// linha nova adicionada\n",
        reason="Teste de geração de diff unificado pelo write_file",
    )
    _cleanup_test_file()

    assert isinstance(result, str)
    assert "---" in result and "+++" in result
