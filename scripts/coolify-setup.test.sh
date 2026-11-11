#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/project/scripts" "$tmp/bin"
ln -s "$root/node_modules" "$tmp/project/node_modules"
cp "$root/scripts/coolify-setup.sh" "$root/scripts/coolify-env.mjs" "$tmp/project/scripts/"
: > "$tmp/calls"

cat > "$tmp/bin/coolify" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$COOLIFY_LOG"
case "$1 $2 $3" in
  "database create postgresql") echo '{"uuid":"db-uuid"}' ;;
  "app create github") echo '{"uuid":"app-uuid"}' ;;
esac
MOCK
chmod +x "$tmp/bin/coolify"
printf 'OPENAI_API_KEY=test-key\nOTHER_SECRET=do-not-copy\n' > "$tmp/project/.env.local"

if PATH="$tmp/bin:$PATH" COOLIFY_LOG="$tmp/calls" SERVER_UUID=s PROJECT_UUID=p GITHUB_APP_UUID=g \
  APP_NAME=TestApp REPO=owner/repository DOMAIN=https://app.example.com DB_USER='Bad!' \
  bash "$tmp/project/scripts/coolify-setup.sh" > "$tmp/invalid.log" 2>&1; then
  echo "invalid database identifiers should fail" >&2
  exit 1
fi
[[ ! -s $tmp/calls ]]

PATH="$tmp/bin:$PATH" COOLIFY_LOG="$tmp/calls" SERVER_UUID=s PROJECT_UUID=p GITHUB_APP_UUID=g \
  APP_NAME=TestApp REPO=owner/repository DOMAIN=https://app.example.com \
  bash "$tmp/project/scripts/coolify-setup.sh" > /dev/null
env_file="$tmp/project/.env.production"
grep -Eq '^DATABASE_URL=postgres://request_router:[a-f0-9]{48}@db-uuid:5432/request_router$' "$env_file"
grep -Fxq 'BETTER_AUTH_URL=https://app.example.com' "$env_file"
grep -Fxq 'OPENAI_API_KEY=test-key' "$env_file"
! grep -q 'OTHER_SECRET' "$env_file"
[[ $(stat -c '%a' "$env_file" 2>/dev/null || stat -f '%Lp' "$env_file") == 600 ]]
grep -q -- '--build-time=false --is-literal' "$tmp/calls"
grep -q -- '--instant-deploy=false' "$tmp/calls"
! grep -q 'deploy uuid' "$tmp/calls"
! grep -Eq 'database start|app start|app restart' "$tmp/calls"

calls_before=$(wc -l < "$tmp/calls")
if PATH="$tmp/bin:$PATH" COOLIFY_LOG="$tmp/calls" SERVER_UUID=s PROJECT_UUID=p GITHUB_APP_UUID=g \
  APP_NAME=TestApp REPO=owner/repository DOMAIN=https://app.example.com \
  bash "$tmp/project/scripts/coolify-setup.sh" > "$tmp/retry.log" 2>&1; then
  echo "existing production secrets should block a rerun" >&2
  exit 1
fi
[[ $(wc -l < "$tmp/calls") == "$calls_before" ]]
grep -q 'exists' "$tmp/retry.log"

rm "$env_file"
printf 'DATABASE_URL=reserved\n' > "$tmp/project/.env.deploy"
calls_before=$(wc -l < "$tmp/calls")
if PATH="$tmp/bin:$PATH" COOLIFY_LOG="$tmp/calls" SERVER_UUID=s PROJECT_UUID=p GITHUB_APP_UUID=g \
  APP_NAME=TestApp REPO=owner/repository DOMAIN=https://app.example.com \
  bash "$tmp/project/scripts/coolify-setup.sh" > "$tmp/input-error.log" 2>&1; then exit 1; fi
[[ $(wc -l < "$tmp/calls") == "$calls_before" ]]
printf 'CUSTOM_TOKEN=custom-runtime-secret\n' > "$tmp/project/.env.deploy"
PATH="$tmp/bin:$PATH" COOLIFY_LOG="$tmp/calls" SERVER_UUID=s PROJECT_UUID=p GITHUB_APP_UUID=g \
  APP_NAME=TestApp REPO=owner/repository DOMAIN=https://app.example.com \
  bash "$tmp/project/scripts/coolify-setup.sh" > "$tmp/from-file.log" 2>&1
grep -Fxq "CUSTOM_TOKEN='custom-runtime-secret'" "$env_file"
! grep -q OPENAI_API_KEY "$env_file"

# Explicit deployment preserves Thread's original flow.
rm "$env_file"
: > "$tmp/calls"
PATH="$tmp/bin:$PATH" COOLIFY_LOG="$tmp/calls" SERVER_UUID=s PROJECT_UUID=p GITHUB_APP_UUID=g \
  APP_NAME=TestApp REPO=owner/repository DOMAIN=https://app.example.com \
  bash "$tmp/project/scripts/coolify-setup.sh" --deploy > /dev/null
grep -q -- '--instant-deploy=true' "$tmp/calls"
grep -q 'deploy uuid app-uuid' "$tmp/calls"

# Invalid modes must fail before creating any resources.
rm "$env_file"
: > "$tmp/calls"
if PATH="$tmp/bin:$PATH" COOLIFY_LOG="$tmp/calls" SERVER_UUID=s PROJECT_UUID=p GITHUB_APP_UUID=g \
  APP_NAME=TestApp REPO=owner/repository DOMAIN=https://app.example.com \
  bash "$tmp/project/scripts/coolify-setup.sh" --invalid > /dev/null 2>&1; then exit 1; fi
[[ ! -s $tmp/calls ]]
PATH="$tmp/bin:$PATH" COOLIFY_LOG="$tmp/calls" SERVER_UUID=s PROJECT_UUID=p GITHUB_APP_UUID=g \
  APP_NAME=TestApp REPO=owner/repository DOMAIN=https://app.example.com \
  bash "$tmp/project/scripts/coolify-setup.sh" --setup-only > /dev/null
grep -q -- '--instant-deploy=false' "$tmp/calls"
! grep -Eq 'deploy uuid|database start|app start|app restart' "$tmp/calls"
echo "Coolify setup tests passed."
