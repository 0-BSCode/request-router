# Proposal

## Why

Department task descriptions can follow the guest's language, and unsupported-language detection loses the actual language name. Guest acknowledgements currently read like internal task lists, with bracketed rooms, department labels, and long prefixes.

## What Changes

- Require concise English department summaries while retaining quantities, timing, intent, and verbatim source text.
- Record the actual message-level `detectedLanguage` on each task, including codes for unsupported languages. Derive language support from the application's existing supported-language policy.
- Keep automatic routing and localized guest replies limited to English, Filipino, Cebuano, and their supported mixtures. Other or uncertain languages continue to receive front-desk review and English fallback replies.
- Use English review explanations for whole-message fallbacks, preserving the original guest text separately and using unknown language when extraction fails.
- Replace task-list-style guest replies with short localized sentences for each request and outcome, including clearer room clarification and partial-failure wording.
- Display readable detected-language and support labels alongside department tasks in the existing tester.
- **BREAKING**: Replace the internal extraction response's coarse `language` enum with `detectedLanguage`; require that field in mock Tasks API payloads and processing task results. Update all in-repository producers, consumers, fixtures, and tests together.
- Keep one LLM extraction call, existing department rules, mock-only delivery, and the current reviewer access policy.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `request-understanding`: English extracted details, actual language detection, and supported-language policy independent of detection.
- `task-routing`: English department summaries and review explanations, with detected-language metadata on all task payloads.
- `guest-acknowledgement`: Natural localized sentences, clear clarification, and truthful per-request outcome wording.
- `routing-test-ui`: Display English task summaries, detected language, and derived language support without losing original evidence.

## Impact

- Update `src/lib/guest-routing/` contracts, extraction prompt, routing, templates, orchestration, and nearby tests.
- Update the shared tester component and mock Tasks payload validation through the shared contract.
- Update `messages.jsonl`, `departments.md`, and README contracts and examples.
- No new dependency, model call, database migration, delivery channel, or deployment setting is needed.
- The completed `workspace-at-root` change establishes `/` as the protected workspace and `/app` as a compatibility redirect. This change updates the shared tester component while preserving that navigation and reviewer access behavior.
