# Design

## Context

See `proposal.md` for motivation and scope. The current application is a TanStack Start/React starter with a placeholder homepage, Nitro server build, shared form components, installed Zod, and Vitest configured for Node. Better Auth sessions, a PostgreSQL/Drizzle authentication database, and a protected `/app` workspace have been added. There are no message-processing endpoints or existing capability specs. A design is needed because this change crosses UI, external LLM extraction, two mock API boundaries, and outcome-based acknowledgements.

## Goals / Non-Goals

**Goals:** Keep the full test flow in the existing application, validate untrusted input and model output, make partial results observable, and keep credentials server-side.

**Non-Goals:** No separate backend service, new task/message database tables, authentication redesign, agent framework, LLM-generated acknowledgement, background job, conversation continuation, or production inbox. Each submission is independent.

## Decisions

### One server-side processing endpoint

Add `POST /api/process-message` as a TanStack Start server route. Reuse the existing server deployment instead of adding another service or browser-to-OpenRouter calls. Check the existing Better Auth session from request headers before accepting processing. Return 401 without OpenRouter or mock API calls when the session is missing or expired; a client-side route guard alone is insufficient. Reuse the existing session mechanism rather than adding a new auth layer. The UI submits `{messageId, channel, sender, text}`; validate identifiers and sender as bounded nonempty strings, channel as `whatsapp|email`, and trimmed text at 1 to 5000 characters. Reject bad input with 400 and missing server configuration with a safe 503 before side effects.

Return `{messageId, extractionStatus, extractionError?, tasks, acknowledgement}`. Each task attempt includes its proposed task payload, `created|failed`, and either a task ID or safe error. The acknowledgement includes text, `sent|failed`, and either delivery ID or safe error. Return 200 for completed orchestration even with individual failures; reserve non-2xx for unauthenticated access, invalid input, missing setup, and unexpected processing errors. This preserves partial results instead of losing them to a generic request failure.

### One OpenRouter call for structured extraction

Use server-side platform `fetch`, not a new SDK. Read `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` from server environment without browser-exposed prefixes. Require an explicitly configured general-purpose model that supports structured output; do not hardcode a model or add automatic model fallback.

Call `https://openrouter.ai/api/v1/chat/completions` without streaming, with a strict JSON Schema response format and `provider.require_parameters: true`. OpenRouter documents model and endpoint restrictions, so model switching is limited to compatible endpoints. Keep runtime Zod validation even when schema output is requested. Reference: [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs).

Apply a 30-second extraction deadline and bounded output. Treat HTTP errors, refusal, truncation, missing content, malformed JSON, and invalid schema as extraction failure. Do not retry automatically.

The extraction shape is `{language, requests}`. `language` is `en|fil|ceb|mixed|unsupported|unknown`, indicating the dominant language for reply selection; `mixed` identifies supported-language mixtures without a dominant language. Each request has `type` as `towels|late_checkout|complaint|tour|unknown`, `details`, `sourceText`, `room`, `roomSourceText`, and `roomStatus` as `known|missing|ambiguous`. Nullable room strings preserve labels such as `A204`; there is no invented 1-220 numbering rule. For mixed supported-language messages without a dominant language, use English for replies while still processing their requests.

The system prompt directs extraction only, treats guest content as data, preserves unrecognized actionable portions, and groups quantity or timing into the relevant request. Repeated mentions of the same action are one request; distinct actions remain separate even within one department. Validate required fields and bounded lengths, require supporting excerpts to occur in the original message, and require room evidence for known rooms. Schema or evidence validation failure produces a whole-message review rather than trusting a partially malformed extraction. No numeric confidence threshold is invented.

### Deterministic routing and review

Use a fixed mapping in server code, mirrored in `departments.md`. The model never supplies department names. Known requests with clear rooms follow the mapping. Unknown items and items without clear rooms go to front desk with `needsReview: true` and a reason. Clear items in the same message still route normally.

Unsupported or uncertain language, empty actionable extraction, or extraction failure becomes one whole-message review item, with null room when extraction cannot be trusted. For mixed supported languages the lack of a dominant reply language alone does not trigger review. Missing and ambiguous rooms cause a clarification reply; unsupported language or infrastructure failure alone does not assert that the guest omitted a room.

### Small mock HTTP APIs

Add `POST /api/mock/tasks` and `POST /api/mock/messages` in the existing server. Server orchestration calls them over HTTP using a base derived from the incoming server request, not a client-supplied API URL. Each mock requires a server-configured bearer sandbox credential (`MOCK_API_KEY`), validates its body, and returns 201 with a generated ID. Invalid input returns 400; missing or wrong credentials return 401. Document that these are local demo mocks, not production services.

Task payload: `{messageId, channel, sender, type, details, sourceText, originalMessage, room, department, needsReview, reviewReason}`. Message payload: `{messageId, channel, recipient, text}`. Use a five-second timeout per mock call. Collect task outcomes in request order, continuing after failure, then attempt one acknowledgement. Successful mock responses are stateless simulated acceptance, not durable work or real delivery. Return the payloads in the processing response for inspection rather than building task-list endpoints or storage.

Tests can substitute HTTP responses through the fetch boundary to exercise failures; no public fault-injection flags or UI controls are needed. No automatic retries or rollback. Repeated submissions create new mock tasks; durable deduplication is deferred.

### Templates follow outcomes

Keep a small template dictionary for English, Filipino, and Cebuano, with localized request labels and departments. Select the dominant supported language; default to English for unsupported, uncertain, or evenly mixed language. Assemble successful dispatch, successful review, failed recording, and room clarification clauses from task results. Never insert unvalidated model prose as instructions or promises.

Review confirmation depends on review-task success. Clarification depends on missing or ambiguous room information regardless of task success. A failed Messaging call leaves the generated reply visible with failed status and leaves created tasks unchanged. Transport errors are summarized without exposing tokens or raw provider error bodies.

### Reuse the protected workspace and shared components

Replace only the placeholder workspace section of `src/routes/app.tsx` with labelled sample/channel selectors, textarea, submit button, and results using the existing Card, Select, Textarea, Button, Label, and Badge components. Keep the existing sign-in guard, user identity, sign-out control, root header/footer, homepage, and styling. Use local submission state; no new global store or page is needed.

Load editable samples from one shared fixture source derived from `messages.jsonl`. Generate the message ID per submission and use channel-appropriate synthetic senders. Clear previous results on submit, prevent concurrent submission, announce status accessibly, and render all guest/model text as ordinary React text. Show mock badges, extracted details, task IDs/statuses, review reasons, and acknowledgement text/status. If the processing API returns 401 after session expiry, explain that sign-in is required and provide the existing sign-in route. No room input or credentials/model settings in the UI.

### Focused checks and fixtures

Add representative fixture messages with stable IDs and expected semantic outcomes. Mock OpenRouter HTTP in automated tests for deterministic extraction, routing, templates, API failures, invalid input, invalid model output, and credential checks. Live-model evaluation is a separate manual smoke check with synthetic fixtures and configured credentials, not a CI dependency. Verify UI interaction manually in a browser; keep Vitest's existing Node environment rather than adding a browser-test stack for this page.

## Risks / Trade-offs

- LLM extraction can be wrong despite valid JSON. Preserve evidence and original text, use conservative review routing, and manually evaluate the configured model on multilingual fixtures.
- Guest text reaches OpenRouter and its selected provider. Use synthetic messages for this demo; document that real-guest use requires a separate data-handling decision.
- Template translations need language review. Include readable localized examples and record any unreviewed wording in the README.
- Stateless mocks lose results on reload and do not provide exactly-once delivery. Label them clearly and document duplicate submissions rather than adding persistence.
- The processing endpoint can spend API credit. Require the existing authenticated session before processing. Run this tester locally; public deployment still requires registration/access policy and abuse controls beyond this change.
- OpenRouter/provider support changes. Treat incompatible model settings as visible extraction failure with review fallback, not silent success.

## Migration Plan

No new data migration is needed for routing. Retain the existing authentication database setup and migrations. Add server environment configuration, run the project checks, and start the existing application. Roll back by reverting the change and removing the new environment values. Do not change repository visibility or deploy publicly as part of implementation.
