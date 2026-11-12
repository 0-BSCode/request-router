# Design

## Context

See `proposal.md` for motivation. `src/routes/index.tsx` renders the protected tester, `GuestMessageTester`, which owns its form and result state. `src/components/Header.tsx` renders the navigation bar with the app title and the Better Auth user control, including sign-out. Both mock endpoints are POST-only, validate shared Zod contracts, require a server-configured bearer key, and return generated IDs without storage. Server routes live under `/api`. The README documents their contracts and statuses.

The shared task contract requires `detectedLanguage`, added by the archived `improve-request-notifications` change. A short design is useful to settle routing, navigation, and example ownership without coupling the reference to processing state.

## Goals / Non-Goals

**Goals:** Reach the reference from the navigation bar, protect it like the tester, and keep reference content testable against the current contract.

**Non-Goals:** In-page tabs, preserving tester state across pages, shared submission state, a request console, live payload inspection, generated OpenAPI documentation, or a navigation menu for other pages.

## Decisions

### A separate protected reference route

Add `src/routes/reference.tsx` at `/reference`, with the same `beforeLoad` session check and `/sign-in` redirect as `/`. `/api` is avoided because it already hosts server handlers such as `/api/mock/tasks`. `src/routes/index.tsx` keeps rendering only the tester.

Navigating away unmounts the tester, so its input and any displayed result are lost, as with a reload. This is accepted: the demo already resets on reload, and lifting tester state into a shared layout is not worth the coupling. A pending submission abandoned by navigation still completes on the server; the README already warns that resubmitting can duplicate mock tasks.

### Navigation-bar links

In `Header.tsx`, show App (`/`) and API Reference (`/reference`) links only when the Better Auth session has a user, beside the existing user control. Use TanStack Router `Link`, which marks the active link with `aria-current="page"`; match `/` exactly so it is not active on `/reference`, and mark the active link with a foreground underline (a bottom border that is transparent on inactive links, so nothing shifts) using existing tokens. Hiding links for signed-out visitors is presentation only; route `beforeLoad` checks enforce access. Keep the bar usable at narrow widths by wrapping rather than overflowing.

### A static reference component with validated examples

Add `MockApiReference` using existing Card styling and readable `pre`/`code` blocks. Each endpoint card is an item in the installed Radix `Accordion` (multiple mode, all collapsed initially), whose `h2` header wraps the toggle button and exposes `aria-expanded`. Content is force-mounted so the rendered examples remain testable; because force-mounting disables Radix's own hiding, the component controls open state and sets `hidden` on collapsed content. Put the small set of synthetic request and response objects in a client-safe example module beside the guest-routing contracts. Render those same objects as formatted JSON and validate them in one focused test using `taskSchema`, `outgoingMessageSchema`, `taskReceiptSchema`, and `deliveryReceiptSchema`. This catches stale examples without building a documentation generator or importing server code into the browser.

Use one complete English towel request for room 204 with `detectedLanguage: "en"`, synthetic sender information, and clearly illustrative IDs. Show `Content-Type: application/json` and `Authorization: Bearer <MOCK_API_KEY>` as literal documentation. Explain 201, 400, 401, and 503 and the simulation limits. Do not read environment settings, execute fetch calls, or add Send/Try controls to this component.

### Build on the current contracts and outcome display

Use the committed shared contracts, including `detectedLanguage`. This change adds requirements to `routing-test-ui` rather than replacing its existing "Display end-to-end outcomes" or "Canonical workspace navigation" requirements. Leave the archived notification change and its implementation intact, and do not change the API contracts here.

## Risks / Trade-offs

- Static examples can drift. Validate the rendered objects against the shared schemas and compare endpoint/status documentation with handlers during review.
- Leaving the tester discards unsaved input and results. Accepted as reload-equivalent; documented in the README.
- Navigation links depend on the client session and may appear after a short delay. Access remains enforced by route checks.
- Force-mounted collapsed content could stay visible and focusable. Set `hidden` explicitly and verify it in tests and the browser.

## Migration Plan

No migration or configuration is needed. Deploy the UI with examples matching its shared contracts. Roll back the reference route, navigation links, and reference files together; mock endpoint behavior is unchanged.
