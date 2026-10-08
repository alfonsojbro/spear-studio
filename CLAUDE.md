# Spear Studio: rules for agents and humans

Stack: Next.js 16 on Cloudflare Workers via @opennextjs/cloudflare, D1 (SQLite) + Drizzle,
pnpm + Turborepo, Node 22. Run commands with Node 22 (`.nvmrc`).

## Tenant isolation (D1 has no RLS)
- Every tenant table carries `client_id`. Every read and write goes through
  `apps/web/lib/data/*` with a viewer. Use `getData()` from `@/lib/data/server` in server
  components, actions and route handlers.
- No raw DB access in routes, actions or components. ESLint blocks `@/lib/db`, `drizzle-orm`
  and runtime `@spear/db` imports under `app/` and `components/`.
- Client reads use `clientReadScope(viewer)`. "Missing" and "not yours" both throw
  `NotFoundError` and render a 404, so ids never leak. Membership and invite checks are
  always scoped by `agency_id`.
- New data functions need isolation tests in `apps/web/tests/` (owner, editor, freelancer,
  non-member).
- Vectorize: create metadata indexes (`client_id`) before inserting; every query filters
  by client (or per-client namespace).

## Identity
- No `proxy.ts`/middleware (OpenNext does not run Node middleware). Re-check identity in
  every server component, action and route handler through `getViewer()`/`getData()`.
- Deployed: Cloudflare Access JWT (`Cf-Access-Jwt-Assertion`), verified with `jose` against
  the team JWKS (issuer + AUD checked) in `lib/identity.ts`. No config means no access.
  Dev: `DEV_USER_EMAIL` in `.dev.vars`, honoured only when `NODE_ENV=development`.
- Guest/public pages (P4) use a hashed, expiring token checked server-side; Access Bypass
  only on `/r/*`.

## Jobs
- Web produces, never consumes: `lib/data/jobs.ts` sends to the `jobs` queue (`JOBS_QUEUE`).
- The jobs Worker (`wrangler.jobs.jsonc`, entry `queues/consumer.ts`) starts one Workflow
  instance per message (instance id derived from the message id) and acks.
- Workflow steps must be idempotent (unique keys, `on conflict do nothing`) and return small
  results (< 1 MiB). New job types: add to `JobMessage` in `packages/db/src/schema.ts`.
- Local: `pnpm dev` runs both Workers; they share local D1 and queue state.

## Secrets and media
- Secrets only as Worker secrets or `.dev.vars` (gitignored). Never `NEXT_PUBLIC_*`.
- Media keys `clients/{client_id}/...`; store keys, never URLs. Stream videos carry
  `meta.client_id` and `meta.env`.
- Container jobs must be restartable and driven by Workflows (hosts can stop them).

## Database changes
- Edit `packages/db/src/schema.ts` and add a new `packages/db/migrations/NNNN_name.sql`
  together. Never edit an applied migration. D1 limit: 100 bound params per query, so chunk
  bulk inserts.
- `packages/db/seed-dev.sql` is local only. Never run it with `--remote`.

## UI rules (parent plan section 6)
- Tailwind v4 tokens in `apps/web/app/globals.css`. One accent (`brand`), neutral zinc
  base, semantic status colours only.
- Radius: `rounded-control` (8px) and `rounded-panel` (12px) only; other radius utilities
  do not exist.
- Geist for UI, Geist Mono (`num` utility) for every number. Icons: Phosphor only, imported
  from `@/components/icons`.
- Light + dark (class-based); editors default to dark.
- Every screen ships loading (layout-shaped skeletons), empty (how to fill it) and error
  states. Motion only for feedback; honour `prefers-reduced-motion`.
- UI copy: no em-dashes, concrete verbs, no "elevate/seamless/unleash".

## Process
- Never run repo-wide formatters, `eslint --fix` across the repo, or codemods.
- `next dev` would write `apps/web/AGENTS.md`; it is disabled with `agentRules: false`.
- Dev servers bind `127.0.0.1` only (the dev identity stub must not reach the LAN).
- Never start a long-running process in the foreground from an agent; background it and stop it.
