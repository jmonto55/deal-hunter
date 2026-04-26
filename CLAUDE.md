# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Turborepo + npm workspaces. Next.js 15 (App Router, UI + API routes in one app) → Drizzle ORM 0.38 → Neon Postgres via the `@neondatabase/serverless` HTTP driver. Tailwind v4 (CSS-first, no `tailwind.config`). TypeScript 5.7. Node ≥ 20.

A separate Fastify backend was explicitly considered and rejected; **all server code lives in `apps/web` as Next API routes** so deploys are a single Vercel target.

## Commands (run from repo root)

- `npm run dev` — Next.js on http://localhost:3000 via Turbo
- `npm run build` / `npm run start` — production build / serve
- `npm run check-types` — typecheck every workspace (no ESLint or test runner is configured)
- `npm run db:push` — push `packages/db/src/schema.ts` directly to Neon (dev convenience)
- `npm run db:generate` → `npm run db:migrate` — generate + apply SQL migrations (production path)
- `npm run db:studio` — Drizzle Studio

There is no test command. There is no lint command. Don't invent one — if you want either, ask first.

## Workspaces

- [apps/web/](apps/web/) — `@deal-hunter/web`. UI in [src/app/](apps/web/src/app/), API routes in [src/app/api/](apps/web/src/app/api/).
- [packages/db/](packages/db/) — `@deal-hunter/db`. Drizzle schema, Neon client, drizzle-kit config.
- [packages/tsconfig/](packages/tsconfig/) — `@deal-hunter/tsconfig`. Shared `base.json` only.

Workspace deps use `"*"` version pins (e.g. `"@deal-hunter/db": "*"`).

## Conventions that aren't obvious from the code

- **DB client is lazy.** Always import `getDb` from `@deal-hunter/db` and call it inside the request handler. There is no top-level `db` export — that's deliberate so `next build` doesn't need `DATABASE_URL`. See [packages/db/src/client.ts](packages/db/src/client.ts).
- **Single `.env` at the monorepo root.** [packages/db/drizzle.config.ts](packages/db/drizzle.config.ts) uses dotenv to load `../../.env` so drizzle-kit and Next.js share one file. Don't add a second `.env` inside `packages/db`.
- **`packages/db` ships as TS source, no build step.** Next.js consumes it via `transpilePackages: ["@deal-hunter/db"]` in [apps/web/next.config.ts](apps/web/next.config.ts). Don't add a `tsup`/`tsc` build for the db package — it'll just create stale `dist/` outputs.
- **Drizzle `casing: "snake_case"`** is set on both the client and drizzle-kit, so schema columns are written camelCase in TS and mapped to snake_case in SQL automatically. Don't double-name columns.
- **Next config sets `output: "standalone"` and `outputFileTracingRoot: "../../"`** so the standalone bundle picks up monorepo deps correctly. Required for the Dockerfile and recommended for Vercel.
- **Tailwind v4 is CSS-first.** Config lives in [apps/web/src/app/globals.css](apps/web/src/app/globals.css) via `@import "tailwindcss"`; there is no `tailwind.config.{ts,js}`. PostCSS uses `@tailwindcss/postcss`.

## Adding a table / changing schema

1. Edit [packages/db/src/schema.ts](packages/db/src/schema.ts). Export the table and `$inferSelect` / `$inferInsert` types.
2. In dev: `npm run db:push`. For prod-bound changes: `npm run db:generate` (writes SQL into `packages/db/drizzle/`), then `npm run db:migrate`.
3. Re-export from [packages/db/src/index.ts](packages/db/src/index.ts) if route handlers need it.

## Deploy target

Vercel, Root Directory = `apps/web`, env var `DATABASE_URL` must be the Neon **pooled** connection string (hostname ends in `-pooler.<region>.aws.neon.tech`). The HTTP driver works with both, but the pooled URL is what's expected here.
