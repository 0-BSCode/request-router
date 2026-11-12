# Design

## Context

See proposal.md for motivation. The app already has Better Auth with Drizzle/Postgres, public sign-up, a server session helper for `/app`, and an independent session check in `process.server.ts`. Its current real-auth test registers an account. The existing routing-test-ui spec requires authentication but does not restrict which user is authorized.

Cally has a working reference in `src/lib/owner.ts`, `src/lib/bootstrap-owner.ts`, `src/lib/auth.ts`, and `scripts/bootstrap-owner.ts`. Its account tables match the structures restored here. The current production command migrates before starting Nitro; Docker invokes that command. The Coolify helper already reads a private runtime file but does not validate owner settings.

## Goals / Non-Goals

**Goals:** Reuse Cally's initialization and authorization behavior while preserving the guest-routing flow, existing schema, and deployment modes. Authenticate multiple browsers as the same configured account.

**Non-Goals:** No new identity provider, account-management UI, database cleanup, password recovery, email delivery, or VPS changes. Infrastructure project creation is outside this auth change.

## Decisions

### Reuse the configured-owner model and existing auth tables

Adapt Cally's email normalization and password validation helpers. Reuse Better Auth's password hashing and the existing user/account/session tables. Keep the established `OWNER_EMAIL` and `OWNER_PASSWORD` names to match deployment conventions.

An environment-only login would duplicate password and session handling. A new singleton table would add a migration without improving the one-account invariant.

### Initialize transactionally before serving

Adapt Cally's bootstrap helper with a transaction and PostgreSQL advisory transaction lock. Check for at most two users, accept only the sole configured user with one complete credential account, and otherwise fail without changing account data. For an empty database, hash the exact initial password and insert the user and password account atomically. Never use public sign-up for initialization.

Add an explicit `auth:bootstrap` command using the same tsx runner as Cally, with its package and lockfile update. Production startup becomes migrate, bootstrap, then server. Development runs bootstrap before Vite after the documented migration step. Building stays independent of database connectivity and owner secrets. The bootstrap entry point closes its database pool and reports useful failures without credentials.

Automatic upserts or password resets were rejected because a redeployment must not overwrite the credentials already shared with reviewers.

### Check the configured owner at both session creation and access

Set Better Auth's `disableSignUp` option. Adapt Cally's session-creation hook to reject non-owner users, and its `getOwnerSession(headers)` helper to reject previously issued non-owner sessions. Use that shared helper in the existing server session function and message-processing endpoint. Preserve origin validation, input validation, external-call ordering, and response contracts.

Only hiding registration links would leave the registration API open. Checking the owner only at login would leave previously issued non-owner sessions usable.

### Remove registration UI without changing login behavior

Remove the sign-up route and sign-up branch/links from the auth form, and regenerate the route tree. Keep the sign-in page, normal sign-out, and authenticated workspace. Update auth and routing mocks to reflect the shared owner check.

No single-session restriction is added. Each browser receives its own session; signing out uses Better Auth's normal session-specific behavior.

### Validate deployment inputs before remote creation

Read owner settings from the same private input file used by the Coolify helper. Validate the email and initial password before creating either remote resource. Keep owner values out of build arguments and log output and preserve literal password characters. Retain `.env.production` overwrite protection and both setup-only and explicit deployment modes.

Document owner settings for native development, Compose, and Coolify. Compose should pass `.env.local` values through unchanged rather than introduce a default owner password. After first successful startup, operators can remove the initial password from runtime settings; keep the owner email stable. The setup helper continues to require initialization credentials because it creates fresh resources, rather than changing credentials for existing resources.

## Risks / Trade-offs

- Shared credentials cannot identify individual reviewers. This is accepted for the demo; sessions remain independent.
- An existing local database may have registered test accounts. Bootstrap deliberately stops; use a fresh database or explicitly resolve account state without automatic deletion.
- Changing `OWNER_PASSWORD` does not rotate the stored password. Document the limitation and keep the credential in a password manager; no reset tooling is introduced here.
- Changing or omitting `OWNER_EMAIL` denies access and fails supported startup. Keep the configured email consistent across deployments.
- Live secrets could leak through shell tracing or diagnostic output. Never enable tracing around credentials; use ignored runtime files, existing literal serialization, and tests asserting secrets are absent from failures.

## Migration Plan

No schema migration is required. Before deploying, supply valid owner settings and confirm the target database is empty or contains only the intended complete account. Run normal startup to apply existing migrations and initialize the account. Verify registration is blocked, the configured account can sign in from two browsers, and anonymous/non-owner processing is rejected before external requests.

Rollback restores the prior app version and startup configuration without deleting auth data. The prior version permits public registration, so keep access restricted if a rollback is necessary. Actual deployment remains a separate operator action.
