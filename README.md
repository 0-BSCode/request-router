# Guest request router

A starter for the Visayas Bay Resort guest request router assessment, adapted from the local `boilerplate-brewery/thread` project.

## Current status

The application includes email/password authentication backed by PostgreSQL and a protected guest-message tester at `/app`. The server extracts multilingual requests through OpenRouter, routes them to three departments through mock Tasks APIs, and sends outcome-based template replies through a mock Messaging API. Task and message results are simulated and not stored.

The assessment brief is preserved in `INSTRUCTIONS.md`. Planning files remain in `openspec/`. Adapting this starter does not start the assessment timer or publish or submit a repository.

## Run locally

Use Node.js 22 or later, pnpm 12.3.4, and PostgreSQL 17. Copy `.env.example` to `.env.local`, set `DATABASE_URL` to a dedicated database, and set `BETTER_AUTH_SECRET` to a random secret of at least 32 characters. Set `OWNER_EMAIL` and an initial `OWNER_PASSWORD` of 8 to 128 characters. Keep credentials out of Git.

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

Open http://localhost:3000, sign in at `/sign-in` with the configured owner credentials, and open `/app`. Startup creates the account before serving. Registration is disabled and `/sign-up` returns 404.

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

The app uses Cally's single-account setup with Better Auth and Drizzle/Postgres. The existing migration creates `user`, `account`, `session`, and `verification`; this change needs no additional schema migration. Only the configured account can sign in, use `/app`, or process messages. Reviewers can share credentials across independent browser sessions; signing out of one does not sign out the others.

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

OpenAI Codex inspected the source starter and assessment brief, selected and adapted the reusable files, removed unrelated dependencies, and ran validation. Codex subsequently restored Thread's authentication and database code, generated the auth-only migration, and added a database-backed authentication test. Codex also planned and implemented the guest routing flow, multilingual acknowledgement templates, mock APIs, synthetic samples, focused tests, and the protected tester UI. Automated model responses and a temporary local test setup were used for deterministic verification; no live-model accuracy evaluation has been performed.

## Routing API contracts

The routing tester uses synthetic senders `+15550100204` for WhatsApp and `guest@example.test` for email. `messages.jsonl` includes editable examples and expected semantic outcomes. Tasks and acknowledgement delivery are stateless mocks: a successful response simulates acceptance, stores nothing, and contacts no guest. Reloading loses displayed results.

Set `MOCK_API_KEY` in `.env.local` to a nonempty sandbox secret. Keep it on the server. Both mock endpoints require `Authorization: Bearer <MOCK_API_KEY>` and JSON bodies, return 201 on acceptance, 400 for invalid input, 401 for incorrect credentials, or 503 for missing configuration.

- `POST /api/mock/tasks` accepts `{messageId, channel, sender, type, details, sourceText, originalMessage, room, department, needsReview, reviewReason}` and returns `{taskId}`. Rooms are strings or null; review reasons are strings or null. A review task must target front desk with a review reason. Normal tasks require a known type and room.
- `POST /api/mock/messages` accepts `{messageId, channel, recipient, text}` and returns `{deliveryId}`.

The shared schemas in `src/lib/guest-routing/contracts.ts` define allowed values and bounds. These APIs are assessment mocks, not production task or messaging services. `.env` and `.env.local` are ignored; `.env.example` contains names and blank routing secrets only.

## OpenRouter and processing

Set `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and `MOCK_API_KEY` in `.env.local`, alongside the existing database/auth settings, then restart the app. Choose a general-purpose model whose endpoint supports [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs). The model is required configuration, not a UI setting. The server uses one non-streaming extraction call, a strict JSON Schema, required parameter support, runtime validation, a 30-second extraction deadline, and five-second deadlines for each mock call. No new SDK is needed.

`POST /api/process-message` requires a valid Better Auth session. Requests without a session return 401 before any OpenRouter or mock call. Input errors return 400; missing routing configuration returns 503. The request origin must match `BETTER_AUTH_URL`, which also prevents forwarding the sandbox key to an arbitrary host. Completed processing returns 200 even if some task attempts or acknowledgement delivery failed. Read individual statuses rather than treating HTTP 200 as proof that every step succeeded.

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

English, Filipino, and Cebuano are supported, including mixtures within that set. The LLM selects a dominant language; evenly mixed supported-language messages use English templates but still route normally. Unsupported or uncertain languages go to whole-message front-desk review with English replies. A schema-valid result is not proof of semantic accuracy, so original text and verbatim evidence are retained.

See `departments.md` for the three departments, fixed category mapping, splitting rules, and review reasons. For example, `multi-en` creates towels and late-checkout tasks for one room; `same-department` creates two front-desk tasks; `repeat` represents only one towel request; `separate-rooms` keeps each room assignment. `unknown` retains the known request and reviews the unknown portion. `missing` and `ambiguous` ask for the room. Expected results are recorded beside each synthetic sample in `messages.jsonl`.

Acknowledgements use English, Filipino, or Cebuano templates after task attempts finish. They confirm only recorded work, distinguish front-desk review from normal routing, request room clarification where needed, and report recording failures. Late checkout is acknowledged as a request, never approved. No second LLM call writes the reply. Template translations have not been reviewed by a language specialist.

For a live-model evaluation, load each sample in the signed-in workspace, compare task counts/types/rooms/details with its `expected` field, check the template language and review reasons, and record the configured model and date. Include all supported languages, mixed language, multi-request splitting, missing/ambiguous rooms, and an unknown request. Automated tests use controlled model responses to test validation and routing; they do not measure a real model's language understanding.

## Failures and limits

Failed or invalid extraction creates one front-desk review task instead of guessing. Per-task failures do not erase successful tasks, stop other attempts, or trigger automatic retries. A failed acknowledgement leaves task outcomes intact. Provider response bodies and credentials are not returned to the browser. Session expiry requires signing in again; the processing endpoint checks sessions independently of the page.

This is a local reviewer tester. It has no durable task/message history, rollback, automatic retry, or deduplication across submissions. Submitting again can create duplicate mock tasks. Do not use real guest data: message text is sent to OpenRouter and its selected provider. Public registration is disabled and access is restricted to the configured shared account. Broader public use would still need abuse controls.

## Using the routing tester

1. Start the app with its database/auth environment and the three routing values set. Sign in and open `/app`.
2. Choose a sample or edit the guest message. Select WhatsApp or email. The room belongs in the text, not a separate field; the UI supplies a fresh message ID and a synthetic sender.
3. Click Process message. The form is disabled while processing; loading a sample alone never submits it.
4. Inspect each task's department, room, details, source evidence, ID, review reason, and created/failed status. Read the exact acknowledgement and its separate sent/failed status. Mock badges mean no actual service was scheduled or message delivered.
5. If the session expires, use Sign in again. If a request fails before a result is received, check before resubmitting because partial work might already have happened.

Only the most recent submission is displayed. Editing the form does not alter an existing result, which retains its submitted message; a new submission clears it. There is no task-management screen, model selector, or history.

## Verification and next steps

Verified on November 12, 2026: formatting, lint, type checks, deterministic routing tests, production build, and the existing database-backed auth test against an isolated disposable database. Browser checks used the production build with a temporary controlled OpenRouter response source outside the repository, while actual local mock HTTP endpoints and real auth sessions were exercised. Checks covered editable samples, loading state, keyboard submission, multi-request routing, missing-room review, English/Filipino/Cebuano templates, partial task failure, blank input, and session expiry. No production fault-injection control is included.

Live OpenRouter evaluation was not performed because no real OpenRouter credentials/model were configured. Controlled responses verify application behavior, not real model accuracy. Before relying on the result, configure a compatible model and run the sample checklist above. Next steps are a live multilingual evaluation, language review of the templates, and, if this grows beyond an assessment, durable task storage and deduplication, guest-channel integration, and deployment access/abuse controls.

To verify local/deployment quoting with temporary dummy credentials, run `node scripts/env-format.test.mjs`. This requires Docker and does not read local env files.
