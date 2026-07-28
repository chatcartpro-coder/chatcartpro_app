# ChatCart Pro — App

AI-native WhatsApp Business messaging platform (app.chatcartpro.com). See the
architecture and phased roadmap in the plan this repo was scaffolded from.

## Structure

- `apps/web` — Next.js dashboard (tenant-facing UI)
- `apps/api` — Fastify API + WhatsApp webhook ingestion
- `apps/workers` — BullMQ workers: webhook processing, message sending
- `packages/db` — Prisma schema + client, shared by all apps
- `packages/shared-types` — Zod schemas / types shared across apps
- `packages/whatsapp-client` — Meta WhatsApp Cloud API wrapper + webhook verification
- `infra/docker-compose.yml` — local Postgres (pgvector) + Redis

## Local development

```bash
# 1. Start local infra
docker compose -f infra/docker-compose.yml up -d

# 2. Install dependencies
pnpm install

# 3. Copy env files and fill in secrets
cp apps/api/.env.example apps/api/.env
cp apps/workers/.env.example apps/workers/.env
cp apps/web/.env.example apps/web/.env
cp packages/db/.env.example packages/db/.env

# 4. Generate Prisma client and run migrations
pnpm db:generate
pnpm db:migrate
pnpm --filter @chatcartpro/db migrate:rls   # applies row-level security policies

# 5. Run everything
pnpm dev
```

`apps/web` runs on :3000, `apps/api` on :8080 by default.

### Auth setup (Supabase)

Auth uses Supabase Auth. You need a Supabase project (free tier is fine):

1. Create a project at supabase.com, point `DATABASE_URL` at its connection string
   (or run against local Postgres for schema work, and Supabase only for auth — see note below).
2. Copy the project's URL + anon key into `apps/web/.env` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Copy the project's JWT secret (Settings > API > JWT Secret) into
   `apps/api/.env` as `SUPABASE_JWT_SECRET` — the API verifies tokens locally
   against this rather than calling Supabase per request.
4. Sign up at `/signup`, complete the industry/business-name form at
   `/onboarding` (creates your `Tenant` + `Plan` + `User` row), then land on
   `/dashboard`.

Row-level security (`packages/db/prisma/migrations_manual/001_rls_policies.sql`)
is a backstop enforced at the Postgres level via a `current_tenant_id()`
helper that resolves `auth.uid()` through the `users` table — it requires a
Supabase (or any Postgres exposing an `auth.uid()`-compatible function)
database, so it's a no-op against a bare local Postgres without Supabase's
auth schema. Application code must still filter every tenant-scoped query by
`tenantId` explicitly; RLS does not replace that.

## Phase 0 status

Auth/multi-tenancy is wired (Supabase Auth, tenant onboarding, RLS policies,
API JWT verification). Still missing: WABA embedded signup UI, contact
opt-in/out import UI, and the Meta App Review submission — start that review
in parallel with further engineering since it has a multi-week lead time.
