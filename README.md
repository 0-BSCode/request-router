# Guest request router

A starter for the Visayas Bay Resort guest request router assessment, adapted from the local `boilerplate-brewery/thread` project.

## Current status

Only the application foundation is implemented. Message classification, room extraction, splitting multiple requests, department routing, mock Tasks and Messaging APIs, sample messages, and acknowledgement behavior remain to be built.

The assessment brief is preserved in `INSTRUCTIONS.md`. Planning files remain in `openspec/`. Adapting this starter does not start the assessment timer or publish or submit a repository.

## Run locally

Use Node.js 22 or later and pnpm 12.3.4. No database, account, environment variables, or API keys are required for this starter.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000.

## Check and build

```sh
pnpm generate-routes
pnpm check
pnpm test
pnpm build
node .output/server/index.mjs
```

The development server and build regenerate `src/routeTree.gen.ts` when routes change. `pnpm generate-routes` generates it explicitly before standalone type checks. The production build produces a standalone Nitro Node server.

Alternatively, run `docker compose up --build` and open http://localhost:3000.

## What was reused

- TanStack Start and Router, React, TypeScript, and TanStack Query.
- Tailwind CSS and the starter's shared UI components.
- Vite+ formatting, linting, type checking, Vitest, and GitHub checks.
- The SEO helper and its existing test.

The resume site, chatbot, demos, content collections, authentication, database, and deployment automation were excluded. Server endpoints can be added under `src/routes/` alongside the UI without introducing a separate backend. The template's dependency versions and lockfile are retained where applicable.

## AI use

OpenAI Codex inspected the source starter and assessment brief, selected and adapted the reusable files, removed unrelated dependencies, and ran validation. Record further AI use and implementation decisions here as the router is built.
