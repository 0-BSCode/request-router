# Tasks

## 1. Canonical workspace and authentication navigation

- [x] 1.1 Move the existing protected workspace into `src/routes/index.tsx`, replace `/app` with a redirect to `/`, remove landing-page and Back home navigation, and regenerate the route tree. Add focused tests verifying owner access at `/`, signed-out root redirection, legacy-path redirection, and no duplicate workspace rendering.
- [x] 1.2 Change successful auth-form navigation to `/` and redirect authorized sessions away from `/sign-in` while leaving signed-out access available. Ensure both visible sign-out actions navigate to `/sign-in` after successful sign-out. Verify focused navigation tests cover both sign-in states and redirect-loop prevention without changing API authorization.
- [x] 1.3 Update README workspace references to `/` and explain `/app` compatibility. Verify active source/docs contain no obsolete workspace navigation targets outside the legacy redirect and its tests; leave archived historical records unchanged.

## 2. Integration verification

- [x] 2.1 Run formatting, lint, type checks, relevant tests, and production build from an isolated test root without local env files. Record results and confirm no database schema, API paths, auth settings, or deployment configuration changed; never read `.env.local` directly or indirectly.
- [x] 2.2 Verify the built app with synthetic credentials and a disposable database: signed-out `/` goes to sign-in; sign-in lands at `/`; signed-in `/sign-in` returns to `/`; `/app` resolves to the proper destination in both session states; both sign-out controls end access; unauthorized processing still returns 401. Confirm no redirect loops, landing page, or obsolete links remain, without making live LLM requests or deploying to the VPS.

## Verification results

Verified on November 12, 2026 in an isolated copy containing application source, sample fixtures, configuration, scripts, migrations, and shared installed dependencies, with no local env files:

- Route generation completed; five focused navigation tests passed.
- `vp check` passed formatting, lint, and type checks; `tsc --noEmit` also passed.
- `vp test src` passed 74 tests across 10 suites; 10 opt-in database tests were skipped. The unrelated standalone Docker env-format check was not part of this source-test run.
- `vp build` produced the production server successfully.
- The production server ran against a new disposable database with a synthetic account. Browser checks confirmed signed-out `/` and `/app` lead to sign-in, login lands at `/`, authorized `/sign-in` and `/app` return to `/`, the tester appears without landing-page links, and both visible sign-out controls return to sign-in and prevent subsequent protected access. No redirect loops were observed.
- A direct unauthenticated request to `/api/process-message` returned 401.
- No database schema, API-path, auth-origin, deployment configuration, or credential changes were made. No live LLM requests or VPS deployment were performed. `.env.local` was not read or modified, including during checks.
