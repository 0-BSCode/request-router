#!/usr/bin/env bash
# Create a Coolify PostgreSQL resource and Dockerfile app; deploy only with --deploy.
# Usage: SERVER_UUID=… PROJECT_UUID=… GITHUB_APP_UUID=… APP_NAME=… REPO=owner/repo DOMAIN=https://… bash scripts/coolify-setup.sh
# Requires the coolify CLI configured for the target context. Runtime inputs come from .env.deploy or INPUT_ENV_FILE.
set -euo pipefail

mode=${1:---setup-only}
case "$mode" in
  --setup-only|--deploy) ;;
  *) echo "Usage: bash scripts/coolify-setup.sh [--setup-only|--deploy]" >&2; exit 1 ;;
esac
[[ $# -le 1 ]] || { echo "Expected at most one mode argument." >&2; exit 1; }

: "${SERVER_UUID:?Set SERVER_UUID}" "${PROJECT_UUID:?Set PROJECT_UUID}" "${GITHUB_APP_UUID:?Set GITHUB_APP_UUID}"
: "${APP_NAME:?Set APP_NAME}" "${REPO:?Set REPO as owner/repository}" "${DOMAIN:?Set DOMAIN as an https:// URL}"

BRANCH=${BRANCH:-main}
ENV_NAME=${ENV_NAME:-production}
DB_USER=${DB_USER:-request_router}
DB_NAME=${DB_NAME:-request_router}
ENV_FILE=.env.production

[[ $DOMAIN == https://* ]] || { echo "DOMAIN must start with https://" >&2; exit 1; }
[[ $DB_USER =~ ^[a-z_][a-z0-9_]*$ && $DB_NAME =~ ^[a-z_][a-z0-9_]*$ ]] || {
  echo "DB_USER and DB_NAME must be lowercase PostgreSQL identifiers." >&2
  exit 1
}

cd "$(dirname "$0")/.."
[[ -e $ENV_FILE ]] && { echo "$ENV_FILE exists; it is generated output. Use .env.deploy for inputs and inspect this file before retrying so deploy secrets are not overwritten." >&2; exit 1; }

node scripts/coolify-env.mjs validate

uuid() { grep -oE '"uuid": ?"[^"]+"' | head -1 | cut -d'"' -f4; }

instant_deploy=false
if [[ $mode == --deploy ]]; then instant_deploy=true; fi
pw=$(openssl rand -hex 24)
db=$(coolify database create postgresql --server-uuid "$SERVER_UUID" --project-uuid "$PROJECT_UUID" \
  --environment-name "$ENV_NAME" --name "$APP_NAME DB" --postgres-user "$DB_USER" --postgres-password "$pw" \
  --postgres-db "$DB_NAME" --instant-deploy="$instant_deploy" --format=json | uuid)
: "${db:?database creation failed}"
echo "database: $db"

app=$(coolify app create github --github-app-uuid "$GITHUB_APP_UUID" --server-uuid "$SERVER_UUID" \
  --project-uuid "$PROJECT_UUID" --environment-name "$ENV_NAME" --name "$APP_NAME" \
  --git-repository "$REPO" --git-branch "$BRANCH" --build-pack dockerfile --ports-exposes 3000 \
  --domains "$DOMAIN" --format=json | uuid)
: "${app:?app creation failed; database $db was already created}"
echo "app: $app"

umask 077
{
  echo "DATABASE_URL=postgres://$DB_USER:$pw@$db:5432/$DB_NAME"
  echo "BETTER_AUTH_URL=$DOMAIN"
  echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"
  node scripts/coolify-env.mjs append
  # Preserve the legacy AI-key fallback only when no input file was selected.
  if [[ -z ${INPUT_ENV_FILE+x} && ! -f .env.deploy && -f .env.local ]]; then
    grep -E '^(OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY)=.+' .env.local || true
  fi
} > "$ENV_FILE"

# Runtime-only: keep secrets out of `docker build`.
if ! coolify app env sync "$app" --file "$ENV_FILE" --build-time=false --is-literal > /dev/null 2>&1; then
  echo "Runtime environment sync failed. Check the application's environment settings in Coolify." >&2
  exit 1
fi
if [[ $mode == --deploy ]]; then
  coolify deploy uuid "$app"
  echo "Deploy queued. Follow with: coolify app logs $app"
else
  echo "Setup complete. Database and application were created without starting or deploying."
  echo "Before pushing commits, set Auto deploy to Manual deployments only in Coolify."
  echo "When ready: coolify database start $db && coolify deploy uuid $app"
fi
