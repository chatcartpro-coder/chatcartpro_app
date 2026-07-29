# ChatCart Pro App — Project Status

Last updated: 2026-07-29

Repo: `git@github.com:chatcartpro-coder/chatcartpro_app.git` (branch `main`, commit `534f891` + uncommitted work-in-progress — see "Uncommitted changes" below)

This tracks phase-by-phase progress against the original architecture plan
(AI-native WhatsApp Business SaaS, positioned as a better alternative to
app.wanotifier.com, serving all ChatCartPro verticals).

## Phase 0 — Foundations

**Status: partially complete**

| Item | Status |
|---|---|
| Monorepo scaffold (pnpm + Turborepo: apps/web, apps/api, apps/workers, packages/db, shared-types, whatsapp-client) | ✅ Done |
| Prisma schema — full data model (tenants w/ vertical enum, users, WABA connections, contacts, templates, campaigns, conversations/messages, KB docs + pgvector chunks, product feed, escalations + events, plans, audit log) | ✅ Done |
| Postgres RLS policies (tenant isolation backstop) | ✅ Done and **applied** — verified live on `tenants`/`users`/`contacts`/`messages` against the real Supabase Postgres |
| Meta WhatsApp Cloud API client (send text/template messages) | ✅ Done |
| Webhook signature verification + subscription handshake | ✅ Done |
| Fastify API — webhook ingestion endpoint (ACK-fast, enqueues to BullMQ) | ✅ Done |
| BullMQ workers — webhook-processing (dedupes, persists messages/status, updates 24h window) + message-send (enforces 24h/template rule) | ✅ Done |
| Supabase Auth — signup/login/logout, session-refreshing middleware | ✅ Done |
| Tenant onboarding flow (business name + industry → creates Tenant + User + starter Plan) | ✅ Done |
| API JWT verification (Fastify plugin, resolves Supabase JWT → tenantId) | ✅ Done |
| Next.js dashboard shell — Dashboard/Contacts/Templates/Campaigns/Inbox pages, tenant-scoped queries | ✅ Done |
| Local infra (docker-compose: Postgres+pgvector, Redis) | ✅ Written; superseded for Postgres by the real Supabase project now in use — Redis (BullMQ) still needs either Docker locally or a hosted Redis (e.g. Upstash free tier) |
| **Real Supabase project wired in** (URL/anon key/JWT secret, migrations run against it) | ✅ Done — `apps/web/.env` and `packages/db/.env` have real Supabase credentials; schema is live on Supabase Postgres (`aws-1-ap-south-1.pooler.supabase.com`) |
| **Signup → onboarding → dashboard flow verified working** | ✅ Confirmed — 1 real tenant + 1 real user exist in the live database |
| Supabase MCP server connected (`.mcp.json` added) | 🟡 Configured, not yet authenticated in this session — run `claude /mcp` to finish |
| Auth JWT verification upgraded to Supabase's new JWKS/ES256 keys (`jose` + `createRemoteJWKSet`, replacing the earlier HS256 shared-secret approach) | 🟡 In progress, uncommitted — typechecks clean, not yet tested against a live Fastify request |
| `apps/api/.env`: `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | ❌ Still placeholder — needs a real Meta WABA app (see WABA signup below) |
| `ANTHROPIC_API_KEY` (api + workers) | ❌ Still placeholder — not needed until Phase 2 (AI features) |
| WABA embedded signup UI (connect a real WhatsApp number) | ❌ Not started |
| Contact CSV/API import UI | ❌ Not started |
| Knowledge base upload UI | ❌ Not started |
| Product feed management UI | ❌ Not started |
| Meta App Review submission | ❌ Not started — **should start in parallel with engineering, has multi-week lead time** |

## Uncommitted changes (as of this update)

Real work is in progress beyond the last commit — do not blindly overwrite:
- `apps/api/src/plugins/auth.ts` rewritten to verify Supabase JWTs via JWKS/ES256 (`jose`) instead of a shared HS256 secret — matches Supabase's newer API key system.
- `packages/db/prisma.config.ts` added (Prisma 6.19's forward-compatible config file, replacing plain `DATABASE_URL` env resolution; adds a separate `DIRECT_URL` for non-pooled connections).
- `packages/db/prisma/schema.prisma`: added `pg_stat_statements`, `pgcrypto`, `supabase_vault`, `uuid_ossp` Postgres extensions.
- `packages/db/prisma/migrations_manual/001_rls_policies.sql`: fixed to double-quote camelCase column names (Prisma's default mapping) — the original version would have failed against real column names.
- `apps/api`, `apps/workers` package.json scripts now use `tsx watch --env-file=.env` / `node --env-file=.env` for env loading.
- `.mcp.json` added at repo root, configuring the Supabase MCP server (project_ref `orwhonqnixipmwfulfga`).
- `README.md`, various `.env.example` files updated to match the JWKS-based auth vars (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL` instead of the old `SUPABASE_JWT_SECRET`).

All of the above typechecks clean and the Prisma schema validates. **Not yet committed to git** — review and commit when ready.

## Phase 1 — WANotifier parity + tenant setup surfaces

**Status: not started**

Templates + bulk campaigns with per-recipient delivery/read/failed tracking,
basic automations, analytics, shared inbox (UI shells exist from Phase 0 but
show empty/placeholder data — no real campaign-sending or template-submission
logic yet), plus self-serve customer base import / knowledge base upload /
product feed UIs.

## Phase 2 — AI inbox copilot

**Status: not started**

KB ingestion pipeline, RAG-grounded auto-reply, returning-customer context,
human takeover. No AI provider (Anthropic) wiring exists yet anywhere in the
codebase.

## Phase 3 — Lead escalation system (flagship)

**Status: not started**

Escalation state machine, rep routing, delivery/read/reply tracking, reminder
loop, transcript view, Excel export. The `Escalation`/`EscalationEvent` Prisma
models exist (Phase 0 schema work) but no engine logic is implemented.

## Phase 4 — AI campaign generation, AI analytics, AI Marketing Org

**Status: not started**

## Phase 5 — Polish (roles/permissions, billing enforcement, cost tuning)

**Status: not started**

## Phase 6 — AI voice agents

**Status: deferred by design**, not to be designed in depth until Phases 0-5 are stable.

## Immediate next steps (in rough order)

1. Review and commit the in-progress uncommitted changes (see above).
2. Finish Supabase MCP authentication (`claude /mcp` in an interactive terminal).
3. Stand up Redis (Docker locally, or a hosted free tier like Upstash) so `apps/api`/`apps/workers` can run — Postgres is already live via Supabase, only Redis is still unresolved.
4. Build WABA embedded signup flow + submit Meta App Review (start review early — weeks of lead time).
5. Build contact import UI.
6. Fill in real `WHATSAPP_WEBHOOK_VERIFY_TOKEN`/`WHATSAPP_APP_SECRET` once a Meta app exists (from step 4).

## Key docs

- Architecture/roadmap plan: `C:\Users\WN00166894\.claude\plans\hey-claude-can-we-cryptic-heron.md` (on the machine that created it — not part of this repo)
- Setup instructions: see `README.md` in this repo
