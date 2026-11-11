# Proposal

## Why

The assessment demo needs one shared reviewer login, while the current starter allows anyone to register. Reuse Cally's single-account setup so the owner can privately share credentials and redeploy without recreating the account.

## What Changes

- Provision one configured account on first startup using private `OWNER_EMAIL` and initial `OWNER_PASSWORD` settings.
- Preserve existing credentials and sessions on subsequent starts; refuse unexpected account data without deleting it.
- **BREAKING**: Disable public registration, remove its page and links, and require the configured account for the workspace and message-processing endpoint.
- Run account provisioning after migrations and before production startup, and before starting the development server.
- Validate and forward owner settings through the Coolify helper, retaining setup-only and explicit deployment modes.
- Document credential initialization, existing-database handling, and the absence of automatic password reset.
- Exclude individual reviewer accounts, roles, email delivery, password recovery, automatic password rotation, and actual deployment from this change.

## Capabilities

### New Capabilities

- `reviewer-access`: Single-account provisioning, registration restrictions, owner-only sessions, and private deployment configuration.

### Modified Capabilities

- `routing-test-ui`: Restrict workspace and processing access to the configured reviewer account rather than any authenticated user.

## Impact

- Better Auth configuration, session helper, processing endpoint, auth form, registration route, and related tests.
- Account bootstrap helper and startup script, package commands and lockfile, Compose configuration, environment example, Coolify helper/tests, README and deployment documentation.
- Existing PostgreSQL auth tables suffice; no schema migration or automatic data cleanup is needed.
- Existing databases with additional users, a different owner, or incomplete credentials must be resolved explicitly before startup. Secrets remain runtime-only and excluded from Git and build context.
