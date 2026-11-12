# Guest request router

A guest request router for Visayas Beach Resort.

## What it does

The app accepts guest messages from WhatsApp or email and:

1. Extracts the request type, room, details, and language.
2. Creates one mock task for each distinct request.
3. Sends a short acknowledgement through a mock Messaging API.

The tester is protected by email/password authentication. Tasks and messages are simulated and are not stored or sent to real resort systems.

## Review flow

1. Open `/` and sign in with the configured owner account.
2. Choose a sample from the list, or enter a guest message. The samples live in [`messages.jsonl`](messages.jsonl) and include expected outcomes.
3. Choose WhatsApp or email, then click **Process message**.
4. Review the task attempts, departments, rooms, summaries, source text, review reasons, and task status.
5. Open the **Guest reply** tab to inspect the exact acknowledgement and delivery status.
6. Open `/reference` to see the mock Tasks and Messaging API requests and responses.

The UI supplies synthetic senders and a new message ID for each submission. Use synthetic data only. A hosted review needs the owner credentials shared separately from the repository.

## Run locally

Use Node.js 22 or later, pnpm 12.3.4, and PostgreSQL 17. Copy `.env.example` to `.env.local`, then set:

- `DATABASE_URL` for a dedicated PostgreSQL database.
- `BETTER_AUTH_URL` and a random `BETTER_AUTH_SECRET` of at least 32 characters.
- `OWNER_EMAIL` and an initial `OWNER_PASSWORD` from 8 to 128 characters.
- `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` for request extraction.
- `MOCK_API_KEY` for the local mock APIs.

Keep all credentials out of Git.

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

Open <http://localhost:3000>, sign in, and open `/`. The first startup creates the configured owner account. Registration is disabled. Later restarts keep the stored password and sessions. Use a new database for local tests that need a clean account.

To run the production build locally:

```sh
pnpm generate-routes
pnpm check
pnpm test
pnpm build
pnpm start
```

Docker is also supported with `docker compose up --build`. Deployment is optional; the [deployment guide](docs/deployment.md) covers Coolify setup.

## Routing decisions and assumptions

The department mapping is fixed in code. The model extracts requests but cannot choose a department.

| Request | Department |
| --- | --- |
| Towels | Housekeeping |
| Late checkout | Front desk |
| Complaint | Front desk |
| Tour | Concierge |
| Unknown request | Front desk review |

See [`departments.md`](departments.md) for the full rules and examples.

The router makes these decisions:

- It creates one task per distinct action, even when two actions go to the same department.
- A shared room can apply to several requests. Explicitly different rooms stay separate.
- A missing or unclear room creates a front-desk review task with a direct room question.
- An unknown request keeps a known room when one is present, then goes to front-desk review.
- Unsupported or uncertain language sends the whole message to front-desk review with an English reply.
- English (`en`), Filipino (`fil`), Cebuano (`ceb`), and supported mixed-language messages route normally. An unsupported code such as `fr` is preserved for review. `unknown` means language detection was not reliable.
- The acknowledgement uses fixed English, Filipino, or Cebuano templates. It reports recorded task attempts, never approval or completion.

## Mock API contracts

The mock APIs are stateless. A successful call simulates acceptance, stores nothing, and contacts no guest. Both endpoints require JSON and `Authorization: Bearer <MOCK_API_KEY>`.

`POST /api/mock/tasks` accepts:

```json
{
  "messageId": "...",
  "channel": "whatsapp | email",
  "sender": "...",
  "type": "towels | late_checkout | complaint | tour | unknown",
  "details": "...",
  "sourceText": "...",
  "originalMessage": "...",
  "detectedLanguage": "en | fil | ceb | mixed | unknown | other code",
  "room": "204",
  "department": "housekeeping | front_desk | concierge",
  "needsReview": false,
  "reviewReason": null
}
```

It returns `{ "taskId": "..." }`. A review task must target front desk and include a review reason. Normal tasks need a known type and room.

`POST /api/mock/messages` accepts `{ "messageId", "channel", "recipient", "text" }` and returns `{ "deliveryId": "..." }`.

Both endpoints return `201` when accepted, `400` for invalid input, `401` for a bad key, and `503` when the server is missing its mock configuration. The signed-in `/reference` page shows complete examples. Shared schemas live in [`src/lib/guest-routing/contracts.ts`](src/lib/guest-routing/contracts.ts).

## Design tradeoffs and safety

`POST /api/process-message` requires a valid session. It checks the browser origin, input length, and message fields before calling OpenRouter. The server makes one structured extraction call, validates the result, then calls the mock task and message endpoints. Provider credentials and response bodies stay on the server.

The response can contain successful and failed task attempts at the same time. A task failure does not erase other tasks, stop later attempts, or trigger a retry. A failed acknowledgement leaves task results intact. HTTP `200` means processing finished; read the individual statuses to see what succeeded.

This is a reviewer tester, not a production integration. It has no history, rollback, automatic retry, or deduplication. Submitting the same message again can create duplicate mock tasks. Guest text is sent to OpenRouter and its selected provider, so do not use real guest data. Public registration is disabled, and the mock key is never sent to the browser.

## Verification

Verified on November 12, 2026:

- Vite+ formatting, linting, type checks, deterministic routing tests, and a production build passed.
- The source test run passed 108 tests. Ten database tests are opt-in and run separately against a disposable database.
- Browser checks covered editable samples, loading state, keyboard submission, multiple requests, missing rooms, session expiry, partial task failure, and English, Filipino, and Cebuano replies.
- Six controlled live-model cases passed with `openai/gpt-6-luna`: Filipino, Cebuano, supported mixed language, French fallback, multiple requests, and a missing room.

The live-model cases were finite and do not prove accuracy for arbitrary guest messages. Fluent Filipino and Cebuano review is still outstanding.

## Next steps

- Run a larger held-out evaluation with the selected model.
- Review Filipino and Cebuano wording with fluent speakers.
- Add durable task storage, deduplication, and real guest-channel integrations if this becomes a production service.
- Add deployment access and abuse controls before public use.

## AI use

OpenAI Codex inspected the source project, removed unrelated features, restored the authentication setup, and implemented the routing flow, mock APIs, samples, templates, tests, and protected tester UI. It also ran the local and controlled live validation described above.

Anthropic Claude Code (Claude Opus 5.5) implemented the protected `/reference` page, its synthetic examples and schema tests, navigation links, route tests, and related documentation updates.

The author set the product direction, chose the routing and acknowledgement policies, reviewed the generated changes and test results, and checked the app in the browser. The author owns the final code review and deployment decisions.
