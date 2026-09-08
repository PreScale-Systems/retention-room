#!/usr/bin/env bash
# Deploys Retention Room to Cloud Run. Gemini via Vertex AI; ClickHouse credentials in Secret Manager.
# Usage: PROJECT=my-project REGION=us-central1 CLICKHOUSE_HOST=xxx.clickhouse.cloud ./scripts/deploy.sh
set -euo pipefail
PROJECT="${PROJECT:?set PROJECT}"; REGION="${REGION:-us-central1}"; SERVICE="${SERVICE:-retention-room}"
CLICKHOUSE_HOST="${CLICKHOUSE_HOST:?set CLICKHOUSE_HOST}"
CLICKHOUSE_USER="${CLICKHOUSE_USER:-default}"; CLICKHOUSE_PORT="${CLICKHOUSE_PORT:-8443}"

gcloud config set project "$PROJECT" >/dev/null
gcloud services enable run.googleapis.com cloudbuild.googleapis.com aiplatform.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com >/dev/null

if ! gcloud secrets describe clickhouse-password >/dev/null 2>&1; then
  read -rsp "ClickHouse password: " PW; echo
  printf '%s' "$PW" | gcloud secrets create clickhouse-password --data-file=-
fi

PN=$(gcloud projects describe "$PROJECT" --format 'value(projectNumber)')
SA="$PN-compute@developer.gserviceaccount.com"
for ROLE in roles/aiplatform.user roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT" --member "serviceAccount:$SA" --role "$ROLE" >/dev/null
done

gcloud run deploy "$SERVICE" --source . --region "$REGION" --allow-unauthenticated \
  --memory 1Gi --cpu 1 --concurrency 10 --timeout 600 --min-instances 1 \
  --set-env-vars "GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=$PROJECT,GOOGLE_CLOUD_LOCATION=$REGION,CLICKHOUSE_HOST=$CLICKHOUSE_HOST,CLICKHOUSE_PORT=$CLICKHOUSE_PORT,CLICKHOUSE_USER=$CLICKHOUSE_USER,CLICKHOUSE_SECURE=true,CLICKHOUSE_DATABASE=retention" \
  --set-secrets "CLICKHOUSE_PASSWORD=clickhouse-password:latest"

gcloud run services describe "$SERVICE" --region "$REGION" --format 'value(status.url)'
