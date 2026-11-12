# Proposal

## Why

Reviewers currently land on a public introduction page and must open `/app` to use the actual tool. Make the root URL the protected workspace so the shared deployment link leads directly to sign-in or the tester.

## What Changes

- **BREAKING**: Replace the public landing page at `/` with the existing owner-protected workspace.
- Send successful sign-ins to `/`; redirect already authorized visitors from `/sign-in` to `/`.
- Retain `/app` as a redirect to `/` for existing bookmarks and reviewer links.
- Remove the obsolete Open workspace and Back home actions. Ensure sign-out returns to sign-in.
- Update route generation, navigation verification, and the README for the new canonical URL.
- Preserve owner-only access and independent processing-endpoint authorization.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `routing-test-ui`: Serve the tester at `/`, define login and legacy-path redirects, and remove landing-page navigation.

## Impact

- `src/routes/index.tsx`, `src/routes/app.tsx`, `src/routes/sign-in.tsx`, the auth form, shared sign-out navigation if needed, and the generated route tree.
- Route/navigation tests and README references to the workspace.
- No database migration, account reset, dependency addition, API-path change, credential change, or Coolify configuration change is required. Existing sessions remain usable.
- No UI redesign, LLM/routing behavior changes, deployment, commit, or push is included in this planning request. Never read or modify `.env.local` while implementing or verifying the change.
