# Design

## Context

See `proposal.md` for motivation. The existing extraction returns `{language, requests}`; the language is a six-value enum used by routing and acknowledgement selection. `routeRequests` copies request details into tasks and uses the original message itself as whole-message review details. `renderAcknowledgement` combines translated category labels, bracketed rooms, and parenthesized departments into lists.

Task schemas are shared by mock validation, processing results, tests, and the tester. The application has reviewer-only access. The completed `workspace-at-root` change hosts `GuestMessageTester` in `src/routes/index.tsx` at the protected `/` workspace; `/app` redirects to `/`. Sign-in and sign-out navigation are already implemented and covered by `src/lib/workspace-navigation.test.ts`. Notification changes stay in shared routing code and `GuestMessageTester`, preserving this baseline. This design is warranted by the cross-cutting task contract and language-policy changes.

## Goals / Non-Goals

**Goals:** Give staff consistent English summaries, retain useful language metadata, and give guests readable deterministic replies based on actual task outcomes.

**Non-Goals:** Additional model calls, new language support, a translation service, per-request language detection, database storage, new delivery channels, page relocation, authentication changes, or deployment changes.

## Decisions

### One detected-language field with derived support

Replace extraction's `language` with `detectedLanguage`, using lowercase language codes of two or three letters plus `mixed` and `unknown`. The prompt specifies canonical `en`, `fil`, and `ceb` for the supported languages, and actual codes such as `fr` for identified other languages. Do not add a language catalogue dependency or store a separate support boolean.

Keep one small shared policy for determining automatic-routing eligibility and reply language. `en`, `fil`, and `ceb` are supported. `mixed` means only a mixture of supported languages without a dominant language; it routes normally and gets an English reply. A supported mixture with a dominant language uses that language's code. Other language codes require whole-message review and English fallback. `unknown` requires review and an English reply. The prompt must not classify an uncertain mixture involving unsupported languages as supported `mixed`.

Copy the validated message-level code onto every task, including failed task attempts. Whole-message fallbacks preserve the code only when extraction is trustworthy; extraction/validation failures use `unknown`. Retaining the coarse `unsupported` value would discard the language information the user wants, while separate detected/support/reply fields would duplicate derived state.

### English details in the existing extraction call

Ask the same OpenRouter call to write `details` as a concise English summary preserving intent, quantities, timing, and uncertainty. Keep `sourceText`, `roomSourceText`, and `originalMessage` in their original wording. Preserve the existing evidence and room validation, timeouts, structured-output request, and safe extraction errors.

The schema validates the language-code shape and output structure, not the semantic correctness of a translation. Do not add an English-only character filter, numeric confidence threshold, automatic translation retry, or another language-detection call. English words can contain names and non-English proper nouns. Live fixtures must establish whether the configured model follows the English-summary requirement.

### Fixed English explanations for whole-message review

For supported-language per-request review, retain the extracted English summary and current review reason. For whole-message review, select an English explanation from the existing reason codes instead of putting guest text into `details`:

- Extraction failure: "Review the guest message. Automatic extraction failed."
- Unsupported language: "Review the guest message. Its detected language is not supported for automatic routing."
- Uncertain language: "Review the guest message. Its language could not be identified reliably."
- No actionable request: "Review the guest message. No actionable request was identified."

The actual detected language is carried separately. These explanations remain valid even when translation is unavailable. Keep null room, original text, front-desk destination, and review marker as required by the current fallback policy.

### Short outcome-based guest sentences

Keep the existing template approach and one acknowledgement after task attempts finish. Replace label concatenation with English, Filipino, and Cebuano sentence templates selected by request type and outcome. Use a greeting at most once, one short sentence per distinct request outcome, and a separate direct clarification question if needed. Preserve the submitted request order so rooms and outcomes remain easy to follow.

Known successful types get specific wording: towels sent to housekeeping, late checkout passed to front desk for review, a concern shared with front desk, or a tour request passed to concierge. Generic review refers naturally to "your message" or "this request". Include known rooms in natural phrases, especially for distinct rooms; never use bracketed identifiers or parenthesized department labels. Associate clarification with the unresolved request instead of asking for an already-known room.

Example English success copy: "We've sent your towel request for room 204 to housekeeping. We've also passed your late checkout request for room 204 to the front desk for review."

Example partial failure: "We've sent your towel request for room 204 to housekeeping. We couldn't pass on your late checkout request for room 204. Please contact the front desk for help with that request."

Example successful missing-room review: "We've passed your towel request to the front desk. What room are you staying in?"

All-failed outcomes use failure wording and help guidance only. Clarification remains necessary even when its review task failed. A failed Messaging call still displays the prepared reply with failed status and leaves tasks unchanged. No template promises approval, fulfillment, or a follow-up that the system does not implement.

Do not insert English `details` or arbitrary source text into localized guest sentences. Continue using controlled localized request phrases and validated room values. This keeps Filipino and Cebuano replies readable without a second generation call or additional translated-summary fields. Quantities and timing remain available to staff; this change does not introduce structured quantity/time fields solely to echo them in guest templates.

### Contract and UI changes together

Update shared task payload/result validation to require `detectedLanguage`; update orchestration and all fixtures and tests that currently use `language`. The public processing envelope keeps its existing fields and task status meanings. The mock Tasks endpoint inherits the changed contract, so old manual mock callers must include the new required field.

In `GuestMessageTester`, show the English summary, readable detected-language label, and derived support status. Use platform language display names where available, with explicit supported-language and mixed/unknown labels and a raw-code fallback. For example, display "French" with "Unsupported". Keep original evidence accessible and render acknowledgement line breaks as today. Exercise the tester at `/`; retain the existing root authorization, `/app` compatibility redirect, and sign-in/sign-out navigation. No new route or settings screen is required.

### Focused verification

Update deterministic tests at the changed boundaries: language-code validation, propagation to all task types, English fallback reasons, policy for `fr`, mixed/unknown values, mock rejection of missing metadata, template sentences across the three languages, partial/all failure, clarification, multiple rooms, and delivery failure. Retain existing reviewer authorization and error tests. Include the existing workspace-navigation tests in integration checks to verify root access, legacy redirects, and sign-in behavior still work with the changed tester. Run routine checks in an isolated test root without local env files; keep controlled failures away from active user services.

Use synthetic Filipino, Cebuano, supported mixed-language, and French fixtures for live checks. Compare English summary meaning, quantities, and timing; verify language metadata and English fallback policy; inspect the exact prepared guest copy. Deterministic mock responses do not prove English translation accuracy, and machine checks do not replace fluent-speaker review. Record which live and language-review checks actually ran.

## Risks / Trade-offs

- English summaries or language codes can be wrong despite schema validity. Preserve original evidence and validate the configured model with synthetic multilingual cases.
- Revised Filipino/Cebuano sentences can sound unnatural. Review the complete template set with fluent speakers when available and record any missing review.
- New required task metadata changes mock API compatibility. Update the server, shared UI, tests, and documented payload examples together; no dual contract is needed for this stateless mock application.
- The completed workspace change also updates the UI spec. Modify only outcome display in this change and preserve the established root-workspace, compatibility-redirect, and authentication requirements when syncing later.

## Migration Plan

No database migration or environment update is needed. Deploy the prompt, server contracts, routing, templates, and UI together. Existing stateless tasks need no backfill. Rollback must restore those pieces together so mock payload validation and UI parsing agree. Keep active user services and reviewer data intact during testing; use an isolated test setup for forced failures, and use the running app only for explicitly authorized synthetic live-model checks.
