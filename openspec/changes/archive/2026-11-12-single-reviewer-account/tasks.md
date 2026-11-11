# Tasks

## 1. Account initialization and startup

- [x] 1.1 Adapt Cally's owner-setting validation and transactional bootstrap helpers using existing auth tables; verify unit tests cover normalized email, exact passwords, and password length boundaries, and disposable-database tests cover first creation, concurrent initialization, repeat starts with absent/changed initial password, and refusal of unexpected account data without mutation.
- [x] 1.2 Add the bootstrap entry point, tsx runner dependency, lockfile, and `auth:bootstrap` command; wire production startup after migrations and before Nitro and development startup before Vite. Verify successful startup and that initialization failure prevents serving, closes database connections, and prints no credentials.
- [x] 1.3 Add owner settings to `.env.example`, preserve literal runtime input through Compose, and document native/Docker setup, stable email, password persistence, and safe handling of existing databases in README. Verify Compose configuration and run the documented flow against a dedicated disposable database.

## 2. Owner-only authentication and processing

- [x] 2.1 Disable sign-up, adapt Cally's session-creation owner hook and shared owner-session check, and use it in the server session helper and processing endpoint. Replace the registration-based auth test and update processing mocks; verify the owner succeeds, wrong passwords and non-owner sessions fail, missing/invalid owner configuration denies access, and denied processing makes no external calls.
- [x] 2.2 Remove `/sign-up`, simplify AuthForm and its callers to sign-in only, remove registration links, and regenerate the route tree. Verify `/sign-up` returns 404, sign-in offers no registration action, and anonymous `/app` access redirects.
- [x] 2.3 Verify real auth against a migrated disposable test database: registration is blocked before and after initialization, two independent owner sessions coexist, and sign-out invalidates only the signing-out session. Document the test command and the shared-account/no-password-recovery limitations alongside the auth behavior.

## 3. Coolify configuration

- [x] 3.1 Extend private deployment-input validation to require a valid owner email and initial password before remote resource creation, and forward exact owner values runtime-only. Extend mocked shell tests to verify invalid settings cause no remote calls, secrets never appear in errors, literal characters survive, and setup-only versus explicit deployment behavior is preserved.
- [x] 3.2 Update the deployment guide with private owner inputs, first-start behavior, removal of the initial password after initialization, and the distinction between fresh-resource setup and restarting existing resources. Verify examples agree with helper tests and contain no real credentials.

## 4. Integration verification

- [x] 4.1 Run formatting/lint/type checks, unit tests, shell tests, build, and opted-in auth/bootstrap tests against a disposable database; record the commands and results and resolve regressions without introducing a schema migration.
- [x] 4.2 Smoke-test the built server with the disposable database: verify sign-in, protected workspace, owner-only processing authorization, sign-out, missing registration page, and unchanged credentials across restart. Confirm no live OpenRouter calls or VPS deployment are needed for these checks.

## Verification results

Verified locally on November 12, 2026:

- `pnpm check`: formatting, lint, and type checks passed.
- `pnpm test`: 59 tests passed; 10 database tests skipped by default.
- `OWNER_DB_TEST=1 pnpm test src/lib/bootstrap-owner.test.ts`: 6 tests passed against a migrated disposable `_owner_test` database.
- `AUTH_DB_TEST=1 pnpm test src/lib/auth.test.ts`: 4 tests passed separately against that disposable database, with a test auth origin and secret.
- `bash scripts/coolify-env.test.sh` and `bash scripts/coolify-setup.test.sh`: passed using mocked CLI calls, including setup-only and explicit deployment modes.
- `pnpm build`: passed without owner credentials or live database access during the build.
- `docker compose config --quiet`: passed. A temporary Compose container with dummy credentials confirmed raw env-file values preserve punctuation, dollar signs, and leading/trailing spaces.
- A temporary local smoke check exercised `pnpm start` on a fresh disposable database, including migrations and first account creation; sign-in; anonymous and legacy non-owner rejection by both the workspace and processing endpoint; registration API rejection and `/sign-up` returning 404; credential/session persistence after restart with changed or empty initial password; sign-out; and `pnpm start`/`pnpm dev` refusing mismatched owner configuration before serving. Authorized processing used invalid input to exercise authorization without calling OpenRouter or the mock APIs.
- `openspec validate single-reviewer-account --strict` and `git diff --check`: passed. No schema migration was added.

No VPS resources were created or deployed, no live OpenRouter calls were made, and no credentials were sent to reviewers. Password recovery and automatic rotation remain excluded as designed.
