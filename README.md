# deal-hunter

Turborepo monorepo: Next.js 15 (App Router + API routes) + Drizzle ORM + Neon Postgres + Tailwind v4.

## Layout

```
apps/
  web/          Next.js app (UI + API routes)
packages/
  db/           Drizzle schema + Neon client
  tsconfig/     Shared TypeScript config
```

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL` (free Postgres at https://neon.tech)
3. `npm run db:push` — push the schema to Neon
4. `npm run dev` — Next.js on http://localhost:3000

## Scripts

- `npm run dev` — run all apps in dev mode (Turbo)
- `npm run build` — build everything
- `npm run db:generate` — generate Drizzle migrations from schema changes
- `npm run db:push` — push schema directly (dev convenience)
- `npm run db:migrate` — apply generated migrations
- `npm run db:studio` — open Drizzle Studio

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo on Vercel.
3. **Root Directory** → `apps/web`. Vercel auto-detects Next.js + Turborepo from there.
4. Add `DATABASE_URL` env var (Neon **pooled** connection string).

## Docker (optional)

```
docker build -t deal-hunter .
docker run -p 3000:3000 -e DATABASE_URL=... deal-hunter
```
