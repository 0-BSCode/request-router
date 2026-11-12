# Guest request router

A starter for the Visayas Bay Resort guest request router assessment, adapted from the local `boilerplate-brewery/thread` project.

## Current status

The application includes email/password authentication backed by PostgreSQL and a protected guest-message tester at `/`. The server extracts multilingual requests through OpenRouter, routes them to three departments through mock Tasks APIs, and sends outcome-based template replies through a mock Messaging API. Task and message results are simulated and not stored.

The assessment brief is preserved in `INSTRUCTIONS.md`. Planning files remain in `openspec/`. Adapting this starter does not start the assessment timer or publish or submit a repository.

## Run locally

Use Node.js 22 or later, pnpm 12.3.4, and PostgreSQL 17. Copy `.env.example` to `.env.local`, set `DATABASE_URL` to a dedicated database, and set `BETTER_AUTH_SECRET` to a random secret of at least 32 characters. Set `OWNER_EMAIL` and an initial `OWNER_PASSWORD` of 8 to 128 characters. Keep credentials out of Git.

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

Open http://localhost:3000, sign in at `/sign-in` with the configured owner credentials, and open `/`. Startup creates the account before serving. Registration is disabled and `/sign-up` returns 404. The root URL is the protected workspace: signed-out visitors go to `/sign-in`, and signed-in visitors to `/sign-in` return to `/`. Existing `/app` links redirect to `/`.

## Check and build

```sh
pnpm generate-routes
pnpm check
pnpm test
pnpm build
pnpm start
```

The development server and build regenerate `src/routeTree.gen.ts` when routes change. `pnpm generate-routes` generates it explicitly before standalone type checks. The production build produces a standalone Nitro Node server.

Alternatively, run `docker compose up --build` and open http://localhost:3000. Compose reads `.env.local` with normal dotenv-style quoting, starts a separate Postgres service, applies migrations and provisions the owner before the app starts, and preserves data in the `pgdata` volume. `docker compose down` preserves the database; adding `-v` deletes it. The default Compose secret is for local development only.

## Authentication and database

The app uses Cally's single-account setup with Better Auth and Drizzle/Postgres. The existing migration creates `user`, `account`, `session`, and `verification`; this change needs no additional schema migration. Only the configured account can sign in, use `/`, or process messages. Reviewers can share credentials across independent browser sessions; signing out of one does not sign out the others.

`OWNER_EMAIL` is required at startup, trimmed and lowercased, and must stay consistent with the database's sole user. `OWNER_PASSWORD` is required only when the database is empty. Restarting preserves the stored password and sessions even if the initial password is changed or removed from runtime settings. Changing `OWNER_PASSWORD` does not reset the stored password. There is no password recovery or rotation flow; keep the shared credential in a password manager.

Startup refuses additional users, a different owner email, or incomplete password credentials without changing account data. For local tests with old registered accounts, use a new dedicated database or `docker compose -p request-router-reviewer up --build` for a separate volume. Do not delete a volume holding data you need. Use the same dotenv-style format for `.env.local` and `.env.deploy`: enclosing quotes are removed. Single-quote values containing `$`, `#`, or significant spaces so Compose preserves them literally. Simple values can be quoted or unquoted. If an account was created while raw mode was active, any literal quotes in its stored password remain part of that password; parsing changes do not reset accounts. Double-quoted or unquoted `$VARIABLE` expressions are not portable because Compose expands them.

`pnpm start` applies pending migrations, runs `pnpm auth:bootstrap`, then starts the production server. `pnpm dev` runs bootstrap before Vite; run migrations first. Builds require no owner credentials or live database. For Coolify, configure `DATABASE_URL`, `BETTER_AUTH_URL` with the public HTTPS origin, a strong `BETTER_AUTH_SECRET`, `OWNER_EMAIL`, and the initial `OWNER_PASSWORD` as runtime variables. Use a separate database from Cally. No deployment has been performed.

After schema changes, run `pnpm db:generate`, review the generated SQL, and apply it with `pnpm db:migrate`. Additional Drizzle commands are available as `db:push`, `db:pull`, and `db:studio`. Prefer committed migrations for deployment.

The auth and bootstrap suites clear auth data and are opt-in. Use only a migrated disposable database whose name ends in `_owner_test`. Export its `DATABASE_URL`, `BETTER_AUTH_URL=http://localhost:3000`, and a test `BETTER_AUTH_SECRET` of at least 32 characters, then run the suites separately because they share that database:

```sh
OWNER_DB_TEST=1 pnpm test src/lib/bootstrap-owner.test.ts
AUTH_DB_TEST=1 pnpm test src/lib/auth.test.ts
```

These cover initialization, concurrency, safe failures, credential preservation, blocked registration, owner-only access, independent browser sessions, and sign-out. Default `pnpm test` skips these database suites.

## What was reused

- TanStack Start and Router, React, TypeScript, and TanStack Query.
- Tailwind CSS and the starter's shared UI components.
- Vite+ formatting, linting, type checking, Vitest, and GitHub checks.
- The SEO helper and its existing test.
- Better Auth, Drizzle/Postgres, authentication pages, and database commands.

The resume site, chatbot, demos, and content collections were excluded. The restored [Coolify setup helper](docs/deployment.md) creates resources without deploying by default. Server endpoints can be added under `src/routes/` alongside the UI without introducing a separate backend. The template's dependency versions and lockfile are retained where applicable.

## AI use

OpenAI Codex inspected the source starter and assessment brief, selected and adapted the reusable files, removed unrelated dependencies, and ran validation. Codex subsequently restored Thread's authentication and database code, generated the auth-only migration, and added a database-backed authentication test. Codex also planned and implemented the guest routing flow, multilingual acknowledgement templates, mock APIs, synthetic samples, focused tests, and the protected tester UI. Codex subsequently normalized department summaries to English, added actual detected-language metadata, rewrote guest templates, and verified the changes with isolated deterministic tests and synthetic live OpenRouter cases. Fluent-speaker review of the revised templates remains outstanding.

Anthropic's Claude Code (Claude Opus 5.5) revised the OpenSpec plan for the mock API reference, changing in-page tabs to a separate page at the author's direction, and implemented it: the synthetic examples and their schema-validation tests, the collapsible `MockApiReference` component, the protected `/reference` route, navigation-bar links with an active-page indicator, route access tests, and README updates. It ran formatting, lint, type checks, tests, and the production build in an isolated copy without local env files, then synced the spec and archived the change. The author directed these changes, chose the design options, and performed the browser checks; Claude Code did not run a browser.

## Routing API contracts

The routing tester uses synthetic senders `+15550100204` for WhatsApp and `guest@example.test` for email. `messages.jsonl` includes editable examples and expected semantic outcomes. Tasks and acknowledgement delivery are stateless mocks: a successful response simulates acceptance, stores nothing, and contacts no guest. Reloading loses displayed results.

Set `MOCK_API_KEY` in `.env.local` to a nonempty sandbox secret. Keep it on the server. Both mock endpoints require `Authorization: Bearer <MOCK_API_KEY>` and JSON bodies, return 201 on acceptance, 400 for invalid input, 401 for incorrect credentials, or 503 for missing configuration.

- `POST /api/mock/tasks` accepts `{messageId, channel, sender, type, details, sourceText, originalMessage, detectedLanguage, room, department, needsReview, reviewReason}` and returns `{taskId}`. Rooms are strings or null; review reasons are strings or null. A review task must target front desk with a review reason. Normal tasks require a known type and room. `detectedLanguage` is required and validated on every task; older payloads without it are rejected.
- `POST /api/mock/messages` accepts `{messageId, channel, recipient, text}` and returns `{deliveryId}`.

The signed-in API reference page at `/reference` shows complete example requests and responses for both endpoints. The shared schemas in `src/lib/guest-routing/contracts.ts` define allowed values and bounds. These APIs are assessment mocks, not production task or messaging services. `.env` and `.env.local` are ignored; `.env.example` contains names and blank routing secrets only.

## OpenRouter and processing

Set `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and `MOCK_API_KEY` in `.env.local`, alongside the existing database/auth settings, then restart the app. Choose a general-purpose model whose endpoint supports [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs). The model is required configuration, not a UI setting. The server uses one non-streaming extraction call, a strict JSON Schema, required parameter support, runtime validation, a 30-second extraction deadline, and five-second deadlines for each mock call. No new SDK is needed.

`POST /api/process-message` requires a valid Better Auth session. Requests without a session return 401 before any OpenRouter or mock call. Input errors return 400; missing routing configuration returns 503. The browser Origin header must match the public origin in `BETTER_AUTH_URL`. Without that header, the request URL origin must match instead. Proxy-internal request URLs are supported when the browser origin matches; forwarded host headers are not trusted. Mock API calls always use the configured public origin, preventing the sandbox key from being forwarded to a client-controlled host. Completed processing returns 200 even if some task attempts or acknowledgement delivery failed. Read individual statuses rather than treating HTTP 200 as proof that every step succeeded.

For example, after signing in, run this in the browser console on the app's origin, or submit the same text through the tester:

```js
const response = await fetch("/api/process-message", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messageId: crypto.randomUUID(),
    channel: "email",
    sender: "guest@example.test",
    text: "Room 204: two towels",
  }),
});
console.log(response.status, await response.json());
```

The response contains `messageId`, `extractionStatus` (`extracted`, `review`, or `failed`), optional safe `extractionError`, `tasks`, and `acknowledgement`. Each task attempt includes its proposed task plus either `status: 'created'` and `taskId`, or `status: 'failed'` and `error`. The acknowledgement includes its exact template text and either `status: 'sent'` and `deliveryId`, or `status: 'failed'` and `error`. Input text is trimmed and limited to 1–5000 characters; message IDs and senders are limited to 200 characters.

## Understanding and acknowledgements

The single extraction call writes concise English department summaries, preserving intent, quantities, and timing, and returns `detectedLanguage`. Every task carries this message-level value. Codes `en`, `fil`, and `ceb` identify English, Filipino, and Cebuano; an actual unsupported code such as `fr` retains French detection. Supported-language mixtures use the dominant code, or `mixed` if evenly mixed. `unknown` means detection is uncertain or extraction failed. Codes are lowercase two- or three-letter values, plus `mixed` and `unknown`. Routing support is derived in code, not stored as a separate flag.

English, Filipino, Cebuano, and their supported mixtures route normally. Other languages and unknown detection go to whole-message front-desk review with English replies. Fallback task summaries are fixed English explanations of the review reason, with the original message attached unchanged. English summaries are LLM estimates; schema validation cannot establish their translation accuracy. Source evidence remains verbatim.

See `departments.md` for the three departments, fixed category mapping, splitting rules, and review reasons. For example, `multi-en` creates towels and late-checkout tasks for one room; `same-department` creates two front-desk tasks; `repeat` represents only one towel request; `separate-rooms` keeps each room assignment. `unknown` retains the known request and reviews the unknown portion. `missing` and `ambiguous` ask for the room. Expected results are recorded beside each synthetic sample in `messages.jsonl`.

Acknowledgements use short English, Filipino, or Cebuano sentence templates after task attempts finish. Each request outcome has its own paragraph in request order, with rooms written naturally. The reply confirms only recorded work, distinguishes review from normal routing, asks a direct room question beside the unresolved request, and separately explains failures. Late checkout is acknowledged as a request, never approved. No second LLM call writes the reply, and English department summaries are never inserted into localized guest replies. Revised template wording has been checked for internal consistency, but fluent Filipino/Cebuano review remains outstanding.

For a live-model evaluation, load each sample in the signed-in workspace, compare task counts/types/rooms/details with its `expected` field, check the template language and review reasons, and record the configured model and date. Include all supported languages, mixed language, multi-request splitting, missing/ambiguous rooms, and an unknown request. Automated tests use controlled model responses to test validation and routing; they do not measure a real model's language understanding.

### Guest reply examples

The former format looked like `towels [204] (housekeeping); late checkout [204] (front desk)`. Updated English examples:

- Successful forwarding: "We've passed your towel request for room 204 to housekeeping."
- Successful review: "We've passed your message to the front desk for review."
- Missing room: "We've passed your towel request to the front desk for review. Which room is this request for?"
- Partial failure: "We've passed your towel request for room 204 to housekeeping." followed by "We couldn't pass on your late checkout request for room 204." and "Please contact the front desk for help with any request we couldn't pass on."

Each request outcome is a separate paragraph; help guidance appears once if anything failed. No reply confirms approval or completion. Quantities and timing stay in staff summaries; guest templates use localized request phrases and known rooms rather than repeating model-generated details.

## Failures and limits

Failed or invalid extraction creates one front-desk review task instead of guessing. Per-task failures do not erase successful tasks, stop other attempts, or trigger automatic retries. A failed acknowledgement leaves task outcomes intact. Provider response bodies and credentials are not returned to the browser. Session expiry requires signing in again; the processing endpoint checks sessions independently of the page.

This is a local reviewer tester. It has no durable task/message history, rollback, automatic retry, or deduplication across submissions. Submitting again can create duplicate mock tasks. Do not use real guest data: message text is sent to OpenRouter and its selected provider. Public registration is disabled and access is restricted to the configured shared account. Broader public use would still need abuse controls.

## Using the routing tester

1. Start the app with its database/auth environment and the three routing values set. Sign in and open `/`, the tester. The navigation bar links App (`/`) and API Reference (`/reference`) once you are signed in.
2. Choose a sample or edit the guest message. Select WhatsApp or email. The room belongs in the text, not a separate field; the UI supplies a fresh message ID and a synthetic sender.
3. Click Process message. The form is disabled while processing; loading a sample alone never submits it.
4. Inspect each task's English summary, guest language and derived support label, department, room, source evidence, ID, review reason, and created/failed status. Read the exact acknowledgement and its separate sent/failed status. Mock badges mean no actual service was scheduled or message delivered.
5. If the session expires, use Sign in again. If a request fails before a result is received, check before resubmitting because partial work might already have happened.

The API reference page at `/reference` is a static reference for `POST /api/mock/tasks` and `POST /api/mock/messages`, each in a collapsible section that starts collapsed. Expanding one shows headers with a `<MOCK_API_KEY>` placeholder, one synthetic request body and example 201 response per endpoint, and the 400/401/503 meanings above. These are fixed examples, validated against the shared schemas in tests, not records of your submissions; opening it sends no request and shows no live outcomes or credentials. It requires the same sign-in as the tester. Leaving the tester resets its form and results, as a reload does; a submission still pending when you leave completes on the server, so check before resubmitting.

Only the most recent submission is displayed. Editing the form does not alter an existing result, which retains its submitted message; a new submission clears it. There is no task-management screen, model selector, or history.

## Verification and next steps

Verified on November 12, 2026: formatting, lint, type checks, deterministic routing tests, production build, and the existing database-backed auth test against an isolated disposable database. Browser checks used the production build with a temporary controlled OpenRouter response source outside the repository, while actual local mock HTTP endpoints and real auth sessions were exercised. Checks covered editable samples, loading state, keyboard submission, multi-request routing, missing-room review, English/Filipino/Cebuano templates, partial task failure, blank input, and session expiry. No production fault-injection control is included.

Notification updates were verified on November 12, 2026 in an isolated source copy with no local env files. Formatting/lint/type checks, the production build, and 108 source tests passed; 10 opt-in database tests were skipped. The unchanged navigation suite covers root authorization, sign-in, and legacy redirects. Browser checks used a disposable reviewer database and covered English staff summaries with Filipino guest copy, French/unsupported metadata and English review, different rooms, and a controlled partial task failure. Controlled failures were injected only by a temporary test-process hook outside the repository.

Six synthetic live acceptance cases passed using `openai/gpt-6-luna`: Filipino late checkout, Cebuano tour, supported mixed-language requests, French fallback, multiple requests, and a missing room. Checks inspected English summary meaning, quantities/timing where applicable, actual detected-language codes, routing policy, and guest acknowledgement wording. Final Filipino and Cebuano room phrasing was also checked through the browser after a copy edit. The test instance reused existing runtime OpenRouter configuration in memory; local env files, the running app, and its reviewer data were not changed. This finite test set does not establish accuracy for arbitrary input. Fluent Filipino/Cebuano review remains outstanding.

Next steps are broader held-out model evaluation and fluent-speaker review, and, if this grows beyond an assessment, durable task storage and deduplication, guest-channel integration, and deployment access/abuse controls.

To verify local/deployment quoting with temporary dummy credentials, run `node scripts/env-format.test.mjs`. This requires Docker and does not read local env files.
