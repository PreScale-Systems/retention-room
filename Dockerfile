FROM python:3.12-slim
WORKDIR /srv
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080 MCP_CLICKHOUSE_BIN=/opt/mcp-clickhouse/bin/mcp-clickhouse

# The official ClickHouse MCP server lives in its own venv: it needs mcp>=2, ADK's client pins mcp<2.
RUN python -m venv /opt/mcp-clickhouse && /opt/mcp-clickhouse/bin/pip install --no-cache-dir "mcp-clickhouse>=0.6"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
