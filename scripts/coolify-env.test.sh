#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/scripts"
cp "$root/scripts/coolify-env.mjs" "$tmp/scripts/"
ln -s "$root/node_modules" "$tmp/node_modules"
cd "$tmp"
node scripts/coolify-env.mjs validate
[[ -z $(node scripts/coolify-env.mjs append) ]]
cat > .env.deploy <<'ENV'
OWNER_EMAIL=owner@example.com
CUSTOM_TOKEN="  a'b\"$cash=#  "
LITERAL=$(touch should-not-exist)
ENV
# dotenv does not execute substitutions; Coolify receives literal values.
node scripts/coolify-env.mjs append OWNER_EMAIL > actual
! grep -q OWNER_EMAIL actual
[[ ! -e should-not-exist ]]
grep -Fq '$(touch should-not-exist)' actual
[[ $(node scripts/coolify-env.mjs get OWNER_EMAIL) == owner@example.com ]]
[[ $(OWNER_EMAIL=override@example.com node scripts/coolify-env.mjs get OWNER_EMAIL) == override@example.com ]]
# Verify literal serialization using the same outer-quote rule as Coolify.
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
const expected = parse(readFileSync('.env.deploy'));
for (const line of readFileSync('actual', 'utf8').trimEnd().split('\n')) {
  const equals = line.indexOf('=');
  assert.equal(line.slice(equals + 2, -1), expected[line.slice(0, equals)]);
}
JS
if OWNER_EMAIL=$'owner@example.com\n' node scripts/coolify-env.mjs get OWNER_EMAIL > error 2>&1; then exit 1; fi
INPUT_ENV_FILE=.env.deploy node scripts/coolify-env.mjs validate
for invalid in DATABASE_URL BETTER_AUTH_URL BETTER_AUTH_SECRET; do
  printf '%s=private-value\n' "$invalid" > .env.bad
  if INPUT_ENV_FILE=.env.bad node scripts/coolify-env.mjs validate > error 2>&1; then exit 1; fi
  ! grep -q private-value error
done
for invalid in .env.missing .env.production; do
  if INPUT_ENV_FILE=$invalid node scripts/coolify-env.mjs validate > error 2>&1; then exit 1; fi
done
printf 'CUSTOM="one\ntwo"\n' > .env.bad
if INPUT_ENV_FILE=.env.bad node scripts/coolify-env.mjs validate > error 2>&1; then exit 1; fi
printf 'BAD.KEY=value\n' > .env.bad
if INPUT_ENV_FILE=.env.bad node scripts/coolify-env.mjs validate > error 2>&1; then exit 1; fi
