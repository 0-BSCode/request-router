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
export PATH="$tmp/bin:$PATH" COOLIFY_LOG="$tmp/calls" SERVER_UUID=s PROJECT_UUID=p GITHUB_APP_UUID=g
export APP_NAME=TestApp REPO=owner/repository DOMAIN=https://app.example.com
run_setup() { bash "$tmp/project/scripts/coolify-setup.sh" "$@"; }
valid_input() {
  cat > "$tmp/project/.env.deploy" <<'ENV'
OWNER_EMAIL=owner@example.test
OWNER_PASSWORD="  a'b\"$cash=#  "
CUSTOM_TOKEN=custom-runtime-secret
ENV
}

# Validate missing and invalid owner input before any remote calls, without echoing secrets.
if run_setup > "$tmp/error" 2>&1; then exit 1; fi
[[ ! -s $tmp/calls ]]
for invalid in email password; do
  valid_input
  if [[ $invalid == email ]]; then
    printf 'OWNER_EMAIL=invalid\nOWNER_PASSWORD=private-password\n' > "$tmp/project/.env.deploy"
  else
    printf 'OWNER_EMAIL=owner@example.test\nOWNER_PASSWORD=short!\n' > "$tmp/project/.env.deploy"
  fi
  if run_setup > "$tmp/error" 2>&1; then exit 1; fi
  [[ ! -s $tmp/calls ]]
  ! grep -Eq 'private-password|short!' "$tmp/error"
done
valid_input
if DB_USER='Bad!' run_setup > "$tmp/error" 2>&1; then exit 1; fi
[[ ! -s $tmp/calls ]]
if run_setup --invalid > "$tmp/error" 2>&1; then exit 1; fi
[[ ! -s $tmp/calls ]]
printf 'DATABASE_URL=reserved\n' >> "$tmp/project/.env.deploy"
if run_setup > "$tmp/error" 2>&1; then exit 1; fi
[[ ! -s $tmp/calls ]]

for mode in default --setup-only --deploy; do
  valid_input
  : > "$tmp/calls"
  if [[ $mode == default ]]; then run_setup > "$tmp/output"; else run_setup "$mode" > "$tmp/output"; fi
  env_file="$tmp/project/.env.production"
  grep -Eq '^DATABASE_URL=postgres://request_router:[a-f0-9]{48}@db-uuid:5432/request_router$' "$env_file"
  grep -Fxq 'BETTER_AUTH_URL=https://app.example.com' "$env_file"
  grep -Fxq "CUSTOM_TOKEN='custom-runtime-secret'" "$env_file"
  [[ $(stat -c '%a' "$env_file" 2>/dev/null || stat -f '%Lp' "$env_file") == 600 ]]
  grep -q -- '--build-time=false --is-literal' "$tmp/calls"
  ! grep -Eq 'OWNER_PASSWORD|cash|custom-runtime-secret' "$tmp/output" "$tmp/calls"
  # Compare serialized literals with the original parsed values, including password punctuation.
  PROJECT_DIR="$tmp/project" node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from 'dotenv';
const dir = process.env.PROJECT_DIR;
const expected = parse(readFileSync(`${dir}/.env.deploy`));
const lines = readFileSync(`${dir}/.env.production`, 'utf8').split('\n');
for (const [key,value] of Object.entries(expected)) assert.ok(lines.includes(`${key}='${value}'`));
JS
  if [[ $mode == --deploy ]]; then
    grep -q -- '--instant-deploy=true' "$tmp/calls"
    grep -q 'deploy uuid app-uuid' "$tmp/calls"
  else
    grep -q -- '--instant-deploy=false' "$tmp/calls"
    ! grep -Eq 'deploy uuid|database start|app start|app restart' "$tmp/calls"
  fi
  calls_before=$(wc -l < "$tmp/calls")
  if run_setup > "$tmp/retry" 2>&1; then exit 1; fi
  [[ $(wc -l < "$tmp/calls") == "$calls_before" ]]
  grep -q 'exists' "$tmp/retry"
  rm "$env_file"
done
echo "Coolify setup tests passed."
