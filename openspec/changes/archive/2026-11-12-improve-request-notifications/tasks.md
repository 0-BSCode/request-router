# Tasks

## 1. Language metadata and English department tasks

- [x] 1.1 Replace extraction's `language` with validated `detectedLanguage`, add required task metadata, and update all extraction/routing/template-selection/orchestration callers and test fixtures together; verify `en`, `fil`, `ceb`, `fr`, `mixed`, and `unknown` behavior, missing/invalid metadata rejection, and existing reviewer authorization tests.
- [x] 1.2 Derive routing support and reply language from one shared policy without persisting another support field; verify supported languages and supported mixtures route normally while French/unknown require front-desk review and English replies, including every task in a multi-request message.
- [x] 1.3 Update the single extraction prompt to request English details while preserving original excerpts, intent, quantities, timing, and room uncertainty; verify structured response parsing and evidence checks with Filipino/Cebuano/mixed fixtures and ensure no additional LLM call is introduced.
- [x] 1.4 Replace original-message whole-review details with fixed English reason explanations while retaining original text and trusted detection or `unknown` on extraction failure; verify unsupported, uncertain, empty-extraction, extraction-failure, and per-request missing-room outcomes in routing/orchestration tests.
- [x] 1.5 Update mock API payload examples, language policy, and English-summary assumptions in README and `departments.md`, plus fixture expectations in `messages.jsonl`; verify documented payloads satisfy shared schemas and the French fixture retains its actual detected code.

## 2. Readable guest acknowledgements

- [x] 2.1 Replace concatenated category/room/department labels with short English, Filipino, and Cebuano sentence templates for successful forwarding, review, failure, and room clarification; verify all known request types, generic review, language selection, and absence of bracketed-room or parenthesized-department formatting in focused template tests.
- [x] 2.2 Assemble sentences from task outcomes in request order with at most one greeting and correct room associations; verify multi-request/multi-room, partial/all-failed, and clarification-with-failed-review cases without false forwarding, approval, completion, or promised follow-up.
- [x] 2.3 Retain one mock acknowledgement attempt and independent delivery status, using controlled localized phrases rather than English task details in guest replies; verify delivery-failure integration and that arbitrary English summary/source text does not leak into Filipino/Cebuano replies.
- [x] 2.4 Document representative before/after replies for success, review, missing room, and partial failure in README; review complete template wording for clarity and record whether fluent Filipino/Cebuano review occurred or remains outstanding, with examples matching generated results.

## 3. Tester display

- [x] 3.1 Show readable detected-language and derived support labels in `GuestMessageTester` alongside English summaries and original evidence; verify supported, French/unsupported, mixed, unknown, and unavailable-display-name cases without changing the workspace route or reviewer access behavior.
- [x] 3.2 Verify the existing result UI at the protected `/` workspace preserves exact acknowledgement text and line breaks and still shows task/delivery failures independently; perform browser checks for a supported multilingual request, a French review, multiple rooms, and partial failure using an isolated setup for controlled failures, and update the README tester walkthrough while retaining `/app` as a compatibility redirect.

## 4. Integration verification

- [x] 4.1 Run applicable repository setup, route generation if needed, formatting/lint/type checks, tests including `src/lib/workspace-navigation.test.ts`, production build, and strict OpenSpec validation from an isolated test root without local env files; verify root authorization, `/app` redirects, and sign-in/sign-out behavior remain intact, and review the diff for unrelated route/auth changes without editing the completed workspace change or its archive.
- [x] 4.2 With authorized live access and configured model credentials, evaluate synthetic Filipino, Cebuano, mixed-language, French, multi-request, and missing-room messages through the protected `/` tester against expected English meaning, detected-language metadata, policy, and readable guest replies; record model/date/results, or explicitly report unavailable access as an unperformed check without resetting the reviewer account or services.

## Verification results

Verified November 12, 2026:

- Routine checks ran in an isolated source copy without local env files. Formatting, lint, and type checks passed. `vp test src` passed 108 tests; 10 opt-in database tests were skipped. The existing workspace-navigation suite passed, and the production build succeeded.
- Strict validation of this OpenSpec change passed. No route, authentication, database schema, environment, or deployment configuration files were changed by this implementation.
- Six synthetic live acceptance cases passed with `openai/gpt-6-luna`: Filipino late checkout, Cebuano tour, supported mixed-language requests, French fallback, multiple requests, and a missing room. Inspection confirmed English staff summaries, retained quantities/timing, actual detected-language metadata, correct routing/review policy, original evidence, and localized readable guest replies.
- Browser checks exercised the isolated production build at `/` with a disposable database and synthetic reviewer. They covered Filipino department/guest wording, French with Unsupported status and an English review explanation, distinct rooms, and a controlled partial task failure with a truthful guest reply. Final Filipino/Cebuano room phrasing was checked again after a small copy edit.
- The live test instance read existing OpenRouter configuration from the running container into memory without printing secrets or reading local env files. The active user app and reviewer database were not modified. Partial failure was injected only by a temporary test-process hook outside the repository, with no production fault controls added.
- `/app` still redirected to `/`; sign-in reached the root workspace; sign-out returned to sign-in and denied subsequent protected access. Existing navigation and reviewer authorization tests remained intact.
- Fluent Filipino/Cebuano review remains outstanding. Schema checks and this finite live sample do not establish translation or language-detection accuracy for arbitrary messages.
