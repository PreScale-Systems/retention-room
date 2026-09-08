#!/usr/bin/env bash
# Local dev. Needs a ClickHouse (Cloud or `clickhouse server`), GOOGLE_API_KEY, and the MCP server venv:
#   python3 -m venv /opt/mcp-clickhouse && /opt/mcp-clickhouse/bin/pip install "mcp-clickhouse>=0.6"
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
[ -d .venv ] || python3 -m venv .venv
. .venv/bin/activate
pip install -q -r requirements.txt
uvicorn app.main:app --reload --port 8080
