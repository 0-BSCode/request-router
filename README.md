# Guest request router

A starter for the Visayas Bay Resort guest request router assessment, adapted from the local `boilerplate-brewery/thread` project.

## Current status

The application foundation includes email/password authentication backed by PostgreSQL. Message classification, room extraction, splitting multiple requests, department routing, mock Tasks and Messaging APIs, sample messages, and acknowledgement behavior remain to be built.

The assessment brief is preserved in `INSTRUCTIONS.md`. Planning files remain in `openspec/`. Adapting this starter does not start the assessment timer or publish or submit a repository.

## Run locally

Use Node.js 22 or later, pnpm 12.3.4, and PostgreSQL 17. Copy `.env.example` to `.env.local`, set `DATABASE_URL` to a dedicated database, and set `BETTER_AUTH_SECRET` to a random secret of at least 32 characters. Keep credentials out of Git.

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

Open http://localhost:3000. Create an account at `/sign-up`, sign in at `/sign-in`, and open the protected workspace at `/app`.

## Check and build

```sh
pnpm generate-routes
pnpm check
pnpm test
pnpm build
pnpm start
```

The development server and build regenerate `src/routeTree.gen.ts` when routes change. `pnpm generate-routes` generates it explicitly before standalone type checks. The production build produces a standalone Nitro Node server.

Alternatively, run `docker compose up --build` and open http://localhost:3000. Compose starts a separate Postgres service, applies migrations before the app starts, and preserves data in the `pgdata` volume. `docker compose down` preserves the database; adding `-v` deletes it. The default Compose secret is for local development only.

## Authentication and database

Thread's Better Auth server/client, session helper, auth API routes, and Drizzle/Postgres setup are restored. The initial migration creates `user`, `account`, `session`, and `verification`; the demo todos table is excluded. Public registration is currently enabled, as in Thread. Cally's single-account provisioning and registration restriction are not implemented yet. This setup should be restricted before deploying the intended reviewer-only app.

`pnpm start` applies pending migrations before starting the production server. For Coolify, configure `DATABASE_URL`, `BETTER_AUTH_URL` with the public HTTPS origin, and a strong `BETTER_AUTH_SECRET` as runtime variables. Use a separate database from Cally. No deployment has been performed.

After schema changes, run `pnpm db:generate`, review the generated SQL, and apply it with `pnpm db:migrate`. Additional Drizzle commands are available as `db:push`, `db:pull`, and `db:studio`. Prefer committed migrations for deployment.

The real authentication test is opt-in. Point `DATABASE_URL` at a migrated, disposable database whose name ends in `_auth_test`, set `BETTER_AUTH_URL=http://localhost:3000` and a test `BETTER_AUTH_SECRET`, then run `AUTH_DB_TEST=1 pnpm test src/lib/auth.test.ts`. The test checks registration, password hashing, rejected passwords, sessions, and sign-out, then removes the account it created.

## What was reused

- TanStack Start and Router, React, TypeScript, and TanStack Query.
- Tailwind CSS and the starter's shared UI components.
- Vite+ formatting, linting, type checking, Vitest, and GitHub checks.
- The SEO helper and its existing test.
- Better Auth, Drizzle/Postgres, authentication pages, and database commands.

The resume site, chatbot, demos, content collections, and deployment automation were excluded. Server endpoints can be added under `src/routes/` alongside the UI without introducing a separate backend. The template's dependency versions and lockfile are retained where applicable.

## AI use

OpenAI Codex inspected the source starter and assessment brief, selected and adapted the reusable files, removed unrelated dependencies, and ran validation. Codex subsequently restored Thread's authentication and database code, generated the auth-only migration, and added a database-backed authentication test. Record further AI use and implementation decisions here as the router is built.
