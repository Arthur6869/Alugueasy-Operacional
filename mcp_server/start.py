"""
Inicialização segura do Alugueasy MCP Server.
Roda a suite de testes antes de iniciar — aborta se qualquer teste falhar.
"""

import os
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).parent.parent


def _run_tests() -> tuple[bool, int]:
    """Executa pytest silenciosamente. Retorna (passou, n_falhas)."""
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "mcp_server/tests/", "-q", "--tb=short"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )

    if result.returncode == 0:
        return True, 0

    # Conta linhas de falha no output do pytest (linhas que começam com "FAILED")
    failed_count = sum(1 for line in result.stdout.splitlines() if line.startswith("FAILED"))
    if failed_count == 0:
        failed_count = result.returncode  # fallback: usa o exit code

    # Exibe o output completo para facilitar o debug
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)

    return False, failed_count


def main():
    passed, n_failed = _run_tests()

    if not passed:
        print(f"Servidor não iniciado: {n_failed} teste(s) falharam.")
        sys.exit(1)

    # Testes passaram — substitui o processo atual pelo servidor
    # os.execv preserva stdin/stdout, essencial para o protocolo MCP stdio
    server = str(pathlib.Path(__file__).parent / "server.py")
    os.execv(sys.executable, [sys.executable, server])


if __name__ == "__main__":
    main()
