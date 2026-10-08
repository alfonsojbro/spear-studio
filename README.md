# Spear Studio

Internal content production tool for Spear Media. Next.js 16 on Cloudflare Workers
(OpenNext), D1 + Drizzle, pnpm + Turborepo.

```
apps/web        Next.js app (UI, server actions, scoped data layer in lib/data)
packages/core   Roles and timezone helpers (no I/O)
packages/db     Drizzle schema, D1 SQL migrations, local dev seed
```

## Local development (no Cloudflare account needed)

Requires Node 22 (`nvm use`, reads `.nvmrc`) and pnpm 10.

```sh
pnpm install
cp apps/web/.dev.vars.example apps/web/.dev.vars   # once
pnpm dev                                           # http://localhost:3000
```

`pnpm dev` applies the D1 migrations to a local SQLite file (Miniflare, under
`apps/web/.wrangler/`), loads `packages/db/seed-dev.sql` (idempotent, sample data only),
then starts `next dev` on port 3000.

You are signed in as `DEV_USER_EMAIL` from `apps/web/.dev.vars`. Seeded identities:

| Email | Role | Sees |
|---|---|---|
| `owner@spearmedia.test` | Owner | all clients, Team settings |
| `editor@spearmedia.test` | Editor | all clients, cannot create or edit |
| `freelancer@spearmedia.test` | Freelancer | only Norte Fitness |
| `strategist@spearmedia.test` | (open invite) | becomes a Strategist on first visit |

Change the email and restart `pnpm dev` to switch. The stub only works when
`NODE_ENV=development`; any other build refuses to run with it set.

Reset local data: `pnpm db:reset`.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm test      # unit tests + data-layer isolation tests on an in-memory local D1
pnpm build     # next build + OpenNext worker bundle (.open-next/)
```

## First-time setup (Cloudflare, P0b)

Not done yet. P0b adds Cloudflare Access verification, Queues/Workflows and the deploy
steps (`wrangler login`, `wrangler d1 create spear-studio-dev --location enam`, Access app
and policy, Workers Paid plan, `wrangler deploy`). Until then a deployed build grants no
access to anyone.
