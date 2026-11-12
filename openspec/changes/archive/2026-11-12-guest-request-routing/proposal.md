# Proposal

## Why

Visayas Beach Resort needs guest messages turned into actionable department tasks and truthful acknowledgements. The repository provides an authenticated application foundation but no message processing; a small working flow will demonstrate multilingual routing against mock Tasks and Messaging APIs.

## What Changes

- Extract distinct requests, room references, supporting text, and language using a configurable general-purpose model through OpenRouter.
- Support English, Filipino, and Cebuano, including mixed-language messages within that set.
- Route towels to housekeeping, late checkout and complaints to front desk, and tours to concierge.
- Send unknown requests, unsupported languages, extraction failures, and missing or ambiguous rooms to front-desk review without guessing.
- Create tasks through a local mock Tasks API and send outcome-based template acknowledgements through a local mock Messaging API.
- Replace the protected `/app` workspace placeholder with a single-message tester showing tasks, review reasons, acknowledgement, and failures. Require an authenticated session for processing.
- Supply sample messages, department rules, tests, environment setup, and README decisions and AI disclosure.
- Exclude real WhatsApp/email connections, durable task/message storage, conversation history, automatic retries, task management, and model controls in the UI.

## Capabilities

### New Capabilities

- `request-understanding`: Validated multilingual extraction, request splitting, room attribution, and uncertainty handling.
- `task-routing`: Fixed department mapping, front-desk fallback, mock task creation, and per-task outcomes.
- `guest-acknowledgement`: Templates in supported languages based on actual creation outcomes, clarification, and mock delivery status.
- `routing-test-ui`: Single-page input, sample loading, processing state, and observable end-to-end results.

### Modified Capabilities

None. No existing specifications are present.

## Impact

- Extend the existing TanStack Start server and React workspace using installed Zod and shared form/card components.
- Add server-only OpenRouter configuration and a bounded network request. Keep credentials out of browser code and responses.
- Add local mock HTTP API contracts for Tasks and Messaging; no real guest messages are sent.
- Reuse the existing Better Auth session and PostgreSQL foundation without changing account or database behavior.
- Add fixtures and focused Vitest coverage; update README and environment examples without publishing credentials.
- Repository visibility and deployment remain separate from implementation.
