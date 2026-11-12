# Proposal

## Why

Reviewers must currently leave the workspace and read the README to inspect the mock API contracts. A dedicated API reference page, linked from the navigation bar, makes those examples easy to find while keeping the tester page focused on the application demo.

## What Changes

- Add a protected `/reference` page with the same reviewer access check as the tester at `/`. Do not use `/api`, which hosts server endpoints.
- List App (`/`) and API Reference (`/reference`) links in the navigation bar for the signed-in reviewer, indicating the current page.
- Show static examples for `POST /api/mock/tasks` and `POST /api/mock/messages` on the reference page, each in a collapsible section, including headers, JSON requests, success responses, and documented error statuses.
- Explain that the APIs simulate acceptance, store nothing, and contact no guest. Display a credential placeholder only.
- Keep the reference independent of tester submissions, with no live payloads, request execution, or history. Leaving the tester page resets its input and results, as a reload does.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `routing-test-ui`: Add a protected API reference page with collapsible static examples for both mock endpoints, and navigation-bar links between it and the tester.

## Impact

- Add `src/routes/reference.tsx` and the static `MockApiReference` component; add navigation links in `src/components/Header.tsx`. `src/routes/index.tsx` keeps rendering only the tester.
- Add synthetic examples validated against the shared contracts in `src/lib/guest-routing/contracts.ts`, including the required task `detectedLanguage`.
- Add focused example validation and route access tests, verify navigation and existing workspace access, and update the README walkthrough.
- No API behavior, authentication, database, environment, or dependency changes. No submission data is passed to the API reference.
