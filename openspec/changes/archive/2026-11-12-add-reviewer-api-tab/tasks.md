# Tasks

## 1. Static mock API reference

- [x] 1.1 Add client-safe synthetic task/message request and receipt examples matching the current shared contracts, including task `detectedLanguage`; add a focused test that validates the exact rendered examples with all four request/receipt schemas and verify it passes.
- [x] 1.2 Add `MockApiReference` with both POST paths, JSON and placeholder bearer headers, formatted request/201 response examples, error status meanings, simulation limits, and collapsible endpoint sections collapsed initially; inspect the rendered reference against the handlers and verify it has no environment access, tester props, or request execution controls.

## 2. Reference page and navigation

- [x] 2.1 Remove the in-page tabs from `src/routes/index.tsx` so `/` renders only the tester, and add `src/routes/reference.tsx` rendering `MockApiReference` behind the same session check and `/sign-in` redirect; extend the workspace-navigation tests to cover signed-out redirect and authorized access for `/reference`, and regenerate the route tree if needed.
- [x] 2.2 Add App and API Reference links, with an underline marking the active page, to `src/components/Header.tsx` for signed-in reviewers only, using TanStack Router `Link` with exact matching for `/`, `aria-current="page"` on the active link, existing styling, and wrapping at narrow widths; leave the existing sign-out control unchanged.
- [x] 2.3 Update the README walkthrough to describe the tester at `/` and the static reference at `/reference` reached from the navigation bar, including that leaving the tester resets it; verify it distinguishes examples from live outcomes and matches the displayed endpoint documentation, preserving existing notification documentation.

## 3. Integration verification

- [x] 3.1 Run required `vp install`, `vp check`, `vp test`, and `vp run build` in an isolated test setup without private local environment files; verify example validation and workspace-navigation tests pass, and review the diff for unrelated edits. Run `vp env doctor` if setup/toolchain behavior fails.
- [x] 3.2 In a browser, check desktop and narrow widths, keyboard navigation and current-page indication in the navigation bar, signed-out access to `/` and `/reference`, absence of links when signed out, sign-out, the `/app` compatibility redirect, and expanding/collapsing endpoint sections by keyboard; verify opening `/reference` triggers no processing or mock calls and returning to `/` shows the tester's initial state. Record any unavailable browser checks.
- [x] 3.3 Run `openspec validate add-reviewer-api-tab --strict` and confirm this change only adds the planned `routing-test-ui` requirements without modifying the existing "Display end-to-end outcomes" or "Canonical workspace navigation" requirements in the main `routing-test-ui` spec.
