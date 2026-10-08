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
pnpm dev                                           # http://127.0.0.1:3000
```

`pnpm dev` does three things:

1. Applies the D1 migrations to a local SQLite file (Miniflare, under `apps/web/.wrangler/`)
   and loads `packages/db/seed-dev.sql` (idempotent, sample data only).
2. Starts `next dev` on `127.0.0.1:3000` (`PORT` overrides the port).
3. Starts the jobs worker with `wrangler dev -c wrangler.jobs.jsonc` on `127.0.0.1:8787`
   (`JOBS_PORT` / `JOBS_INSPECTOR_PORT` override). It consumes the local `jobs` queue and runs
   the `system-ping` Workflow. Both processes share the same local D1 and queue state.

Both servers bind to `127.0.0.1` on purpose: the dev identity stub would otherwise be
reachable from anyone on your network. Do not pass `--hostname 0.0.0.0`.

Only one `next dev` can run per checkout (Next 16 refuses a second one). A dev server started
before a `wrangler.jsonc` change keeps the old bindings: restart it. The System page then says
"The jobs queue is not connected" until you do.

You are signed in as `DEV_USER_EMAIL` from `apps/web/.dev.vars`. Seeded identities:

| Email | Role | Sees |
|---|---|---|
| `owner@spearmedia.test` | Owner | all clients, Team and System settings |
| `editor@spearmedia.test` | Editor | all clients, System; cannot create or edit clients |
| `freelancer@spearmedia.test` | Freelancer | only Norte Fitness |
| `strategist@spearmedia.test` | (open invite) | becomes a Strategist on first visit |

Change the email and restart `pnpm dev` to switch. The stub only works when
`NODE_ENV=development`; any other build refuses to run with it set.

Reset local data: `pnpm db:reset`. Check the job path: open System, press "Run ping".

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm test      # unit tests, data-layer isolation tests on an in-memory local D1, Access JWT tests
pnpm build     # next build + OpenNext worker bundle (.open-next/)
```

## Architecture of jobs

```
browser -> POST /api/jobs/ping (web Worker, staff only, same-origin)
        -> lib/data/jobs.requestPing() -> Queue "jobs" (producer binding JOBS_QUEUE)
        -> jobs Worker (queues/consumer.ts) -> Workflow "system-ping" (workflows/system-ping.ts)
        -> step "write heartbeat" -> D1 job_heartbeat (idempotent per instance)
System page polls GET /api/jobs/ping for the newest heartbeat.
```

Two Workers share one D1: `spear-studio` (web, OpenNext, `wrangler.jsonc`) and `spear-jobs`
(consumer + Workflows, `wrangler.jobs.jsonc`). Later phases add job types to the same queue.

## First-time setup (Cloudflare) for Alfonso

Nothing below has been run. The agent never logs in or deploys. Do these yourself, in order,
from `apps/web` with Node 22. Replace `<...>` placeholders.

1. **Plan.** In the Cloudflare dashboard, switch the account to **Workers Paid** ($5/month).
   Queues and Workflows work on Free with low limits; Email Sending (P4) and Containers (P2+)
   need Paid.
2. **Log in:** `pnpm exec wrangler login` (opens the browser), then `pnpm exec wrangler whoami`.
3. **Databases** (US East):
   ```sh
   pnpm exec wrangler d1 create spear-studio-dev --location enam
   pnpm exec wrangler d1 create spear-studio-prod --location enam
   ```
   Paste each printed `database_id` into **both** `wrangler.jsonc` and `wrangler.jobs.jsonc`
   (`REPLACE_WITH_DEV_D1_ID`, `REPLACE_WITH_PROD_D1_ID`). Then apply migrations:
   ```sh
   pnpm exec wrangler d1 migrations apply DB --env dev --remote
   pnpm exec wrangler d1 migrations apply DB --env production --remote
   ```
   Never run `seed-dev.sql` remotely. Create the first agency + owner instead:
   ```sh
   pnpm exec wrangler d1 execute DB --env production --remote --command \
     "insert into agency (id, name, slug) values ('<uuid>', 'Spear Media', 'spear-media');
      insert into member (id, agency_id, email, name, role) values ('<uuid>', '<agency uuid>', '<your email, lowercase>', '<your name>', 'owner');"
   ```
   Everyone else is invited from Team settings.
4. **Queues** (plus dead-letter queues):
   ```sh
   pnpm exec wrangler queues create spear-jobs-dev
   pnpm exec wrangler queues create spear-jobs-dev-dlq
   pnpm exec wrangler queues create spear-jobs
   pnpm exec wrangler queues create spear-jobs-dlq
   ```
5. **Deploy the jobs Worker first** (it owns the Workflow and the queue consumer):
   ```sh
   pnpm exec wrangler deploy -c wrangler.jobs.jsonc --env dev
   ```
6. **Deploy the web app:**
   ```sh
   pnpm exec opennextjs-cloudflare build
   pnpm exec opennextjs-cloudflare deploy --env dev
   ```
   Note the `*.workers.dev` URL. Do not open it to the public yet: until step 7 it answers
   "No access" to everyone (that is the safe default).
7. **Cloudflare Access** (Zero Trust > Access > Applications > Add > Self-hosted):
   - Application domain: the web app URL (custom domain recommended, e.g.
     `studio.spearmedia.com`; add it under Workers > spear-studio-dev > Domains first).
   - Policy "Spear staff": Action **Allow**, Include **Emails ending in** `@<staff domain>`,
     plus **Emails** for invited freelancers. Login method: One-time PIN or Google.
   - Copy the **Application Audience (AUD) tag** and your team domain
     (`<team>.cloudflareaccess.com`) into `wrangler.jsonc` under `env.dev.vars`
     (`CF_ACCESS_AUD`, `CF_ACCESS_TEAM_DOMAIN`), then redeploy (step 6).
   - Later (P4): a **second** Access application for `<domain>/r/*` with a **Bypass**
     policy, for client review links. The app checks a hashed, expiring token there.
   - Free Zero Trust covers 50 users; every person who logs in through Access takes a seat.
8. **Smoke test:** sign in through Access, open System, press "Run ping". A heartbeat should
   show within a few seconds. Logs: `pnpm exec wrangler tail spear-jobs-dev`.
9. **Production:** repeat steps 5 to 8 with `--env production` and a separate Access
   application, only when you say go.

Never set `DEV_USER_EMAIL` on a deployed Worker; the app refuses to run with it.
Secrets (later phases) go in with `pnpm exec wrangler secret put <NAME> --env <env>`.
