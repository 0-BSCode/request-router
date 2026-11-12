# Design

## Context

See proposal.md for motivation. `index.tsx` currently renders a public introduction page. `app.tsx` contains the owner-session guard, tester, account information, and workspace sign-out action. The auth form navigates to `/app` on success. `/sign-in` currently has no authenticated-visitor redirect. The shared header links to `/` and has a second sign-out action that does not navigate away.

The routing-test-ui spec explicitly names `/app`; reviewer-access specifies which account is authorized without prescribing the workspace URL. Only routing-test-ui needs a delta.

## Goals / Non-Goals

**Goals:** Reuse the existing workspace and owner-session helper at the canonical root with predictable redirects. Preserve old reviewer links and authentication behavior.

**Non-Goals:** No new layout abstraction, authentication mechanism, database migration, API changes, deployment settings, or interface redesign. No reading or editing `.env.local`, including indirect reads during verification.

## Decisions

### Move the workspace into the index route

Replace the landing-page component in `src/routes/index.tsx` with the workspace component and its existing `getSession` guard, changing the route path to `/`. Remove the obsolete Back home link and unused Outlet/imports where appropriate. Keep the shared root document unchanged so the sign-in page and API routes do not inherit a workspace guard.

A root-to-app redirect would preserve the extra path the user wants removed. A global root-layout auth guard would also affect sign-in and could cause loops.

### Keep `/app` as a minimal redirect route

Replace its workspace implementation with a router redirect to `/` using history replacement. Root performs authorization, so the alias does not duplicate session logic or render the tester. Retain this alias without adding compatibility configuration or a scheduled removal.

Deleting the old route would break already distributed bookmarks with no meaningful reduction in implementation work.

### Make authentication navigation consistent

Change the auth form's successful destination to `/`. Add a sign-in route guard that redirects only an authorized reviewer session to `/` and otherwise allows the login form. Retain the shared header's home link, which already points to the correct destination.

Ensure both existing sign-out controls navigate to `/sign-in` after successful sign-out, preserving error handling and preventing protected access with the ended session. Do not add redirect query parameters or a general return-to mechanism for this single workspace.

### Verify observable routing behavior

Use focused tests for root authorization, the legacy redirect, and the signed-in/signed-out sign-in branches, following existing test conventions without new dependencies. Verify login and both sign-out controls through a browser or production smoke check with a disposable database and synthetic credentials. Existing API authorization tests should continue to pass unchanged.

Run checks from an isolated copy or other explicitly configured test root without local env files. Do not start the user's Compose project or application commands that load `.env.local`. Keep the README's current workspace references aligned with `/`; leave archived historical records unchanged.

## Risks / Trade-offs

- A guard accidentally applied to the shared root document could block login or APIs. Keep it on the index workspace route and verify direct signed-out sign-in access.
- Opposing redirect guards could loop. Root accepts only authorized sessions; sign-in redirects only that same authorized session state. Test both states and legacy navigation.
- The shared sign-out control currently lacks navigation. Include it in verification so a session-ending action does not leave the user on the protected workspace.
- Existing sessions must remain usable. Leave cookie scope, auth origin, account settings, and database data unchanged.

## Migration Plan

No data migration or credential reset is needed. After implementation, regenerate the route tree, run relevant tests and build in isolation, and verify the navigation matrix with synthetic credentials. Deployment is a separate requested action; the existing Coolify configuration and public domain continue to apply.

Rollback restores the prior routing implementation and auth-form destination together. Existing account/session data needs no rollback.
