# Tasks

## 1. Contracts, samples, and mock APIs

- [x] 1.1 Define shared message, extraction, task, and acknowledgement schemas with installed Zod; verify rejection of blank/oversized input, invalid channel values, and inconsistent room states in focused tests.
- [x] 1.2 Add `messages.jsonl` covering all request types, the three languages, mixed language, distinct/shared rooms, unknown requests, unsupported language, and missing/ambiguous rooms; verify every fixture parses and expected semantic outcomes are documented.
- [x] 1.3 Add stateless mock Tasks and Messaging POST endpoints with sandbox bearer authentication, payload validation, and generated IDs; verify success, invalid payload, and incorrect credential responses with endpoint tests.
- [x] 1.4 Document mock API contracts, synthetic senders, non-persistence, and sandbox configuration in README and a credential-free environment example; verify examples match the schemas and real environment files are ignored.

## 2. Complete the single-request path

- [x] 2.1 Implement the server-only OpenRouter extraction call with configurable key/model, structured output, 30-second deadline, runtime/evidence validation, and safe errors; verify an English towel fixture using mocked HTTP and assert the configured model and response schema are sent.
- [x] 2.2 Implement fixed department routing and session-protected `POST /api/process-message` orchestration against the mock endpoints using existing Better Auth; verify an English towel request creates a housekeeping task with its source message ID and room.
- [x] 2.3 Implement the English acknowledgement template and mock send after task creation; verify the successful towel flow returns both task and delivery IDs and does not claim the towels were delivered.
- [x] 2.4 Document OpenRouter setup, compatible-model requirements, the session-protected local processing endpoint, input limits, and one runnable synthetic request; verify the example against the implemented endpoint.

## 3. Multilingual understanding, splitting, and review

- [x] 3.1 Extend the extraction prompt and fixtures for English, Filipino, Cebuano, mixed language, quantities/timing, repeated versus distinct requests, and separate room references; verify parsing/evidence checks with mocked responses and add a documented live-model evaluation checklist.
- [x] 3.2 Route all four known request types and split distinct actions even within one department; verify complete fixture-based routing results and add `departments.md` matching the fixed mapping.
- [x] 3.3 Implement per-item front-desk review for unknown requests and missing/ambiguous rooms, plus whole-message review for unsupported language, empty extraction, and extraction failure; verify known portions still route normally and no room is guessed.
- [x] 3.4 Add Filipino and Cebuano templates, localized labels, English fallback, review confirmation, and room clarification; verify each language and ensure clarification is included without claiming a failed review task exists.
- [x] 3.5 Document splitting rules, language selection, room assumptions, review reasons, and translation-review status; verify each documented example has a corresponding fixture or test.

## 4. Failure behavior and boundary checks

- [x] 4.1 Handle OpenRouter errors, timeout, refusal, truncated output, malformed JSON, fabricated evidence, and incompatible response shapes as visible extraction failures with whole-message review; verify these paths with mocked HTTP and ensure credentials/raw provider errors are not returned.
- [x] 4.2 Preserve task-by-task outcomes on mock API errors/timeouts and attempt one truthful acknowledgement after processing; verify partial failure, total task failure, and acknowledgement failure without retrying or rolling back successful tasks.
- [x] 4.3 Verify missing/expired sessions return 401 before external calls, input rejection and missing configuration produce no side effects, mock payloads/responses are validated, and guest prompt-injection text cannot change department mapping; document local-only operation and duplicate-submission limitations in README.

## 5. Single-page routing tester

- [x] 5.1 Replace the protected `/app` workspace placeholder while retaining its session guard and sign-out control with shared sample/channel selectors, labelled textarea, generated submission ID, synthetic sender, and Process message button; verify in the browser that loading a sample is editable and does not submit it.
- [x] 5.2 Connect the form to the processing endpoint with blank/oversize validation, disabled submission while pending, accessible progress/errors, and results associated with the submitted message; verify keyboard operation, session-expiry sign-in guidance, and that starting a new run clears old results.
- [x] 5.3 Display task details, rooms, departments, IDs, review reasons, and individual statuses, plus exact acknowledgement text and delivery status with mock labels; verify a happy path, review path, and controlled partial-failure response in the browser without adding public failure controls.
- [x] 5.4 Document how to sign in and run the tester, choose samples, read review/failure outcomes, and understand mock-only behavior; verify the walkthrough matches the visible screen and browser responses expose no API credentials.

## 6. Integration verification

- [x] 6.1 Run the repository-required install/setup and route generation, then formatting/lint/type checks, tests, and production build using the project scripts; verify all pass and review the resulting diff for unrelated changes.
- [x] 6.2 With configured OpenRouter credentials, run synthetic samples covering all supported languages, multi-request splitting, and review through the signed-in workspace and mock HTTP endpoints; record the model, results, and any language-review limitations, or explicitly report unavailable credentials as an unperformed live check.
- [x] 6.3 Finish README decisions, tradeoffs, next steps, and AI-tool disclosure; verify they accurately describe the delivered implementation and remaining limitations without changing repository visibility.
