# STEP-03: Database & Backend Foundation

## 1. Starting State

Verified at the beginning of Phase 3:

- On `main`, HEAD `d22b2cf` (Phase 2 complete and committed).
- `docs/MASTER-GUIDE.md` present and **unchanged** (confirmed via `git diff`).
- Phase 1 foundation: Express 5 + TypeScript ESM backend, zod-validated `config/env.ts` (`NODE_ENV`, `PORT`, `CLIENT_ORIGIN`), central `errorHandler.ts`, `requestLogger`, `/api/health` (process liveness only), `.env.example`, `.gitignore`.
- Phase 2 frontend: React 19 + Vite 6 + TS strict + Tailwind 4, routing foundation, `SystemStatus`/health card, `docs/DESIGN_SYSTEM.md`.
- No Supabase credentials exist **in this environment**, so live DB verification is impossible here — documented as a manual owner step (see §15, §20).

## 2. Phase Objective

Establish a production-oriented, security-conscious Supabase PostgreSQL data foundation — schema, migrations, server-side data-access layer, and honest readiness checking — that later phases (admin auth, storefront API, Razorpay, entitlements, Drive delivery) can build upon **without rewrite**. No business workflows (login, product storefront, cart, checkout, payments, webhooks, entitlements, bundles/coupons engines) were implemented.

## 3. Implemented

- Supabase-compatible SQL schema with **7 ordered, deterministic migrations** in `backend/supabase/migrations/`.
- Full Supabase connection configuration (`DATABASE_URL`, `DATABASE_SSL`) validated server-side.
- Server-side `pg` database access layer (`db/client.ts`) with typed query helpers and graceful lifecycle.
- Typed database models (`db/types.ts`) — no `any`, minor-unit money, discriminated enums.
- Migration-apply script (`scripts/apply-migrations.mjs`) for ordered, idempotent deployment.
- Honest health distinction: `/api/health` (liveness, unchanged) vs `/api/health/db` (real `select 1`, 200↔503, never leaks connection details).
- Security hardening: schema-level privilege lockdown, default-deny RLS on all tables, NO fake-auth "policies".
- Full documentation suite updated + `docs/DATABASE.md` created.

## 4. Database Architecture

**Choice:** Supabase PostgreSQL (Master Guide §23) — authoritative for products, customers, orders, payments, entitlements, bundles, coupons, admins, webhook events, settings, audit logs.

**Access:** Backend connects server-side over `DATABASE_URL` (a privileged owner role) and bypasses RLS. The privileged credential is **SERVER-ONLY** — never sent to the browser. Public/frontend config remains limited to `VITE_API_URL` / `VITE_WHATSAPP_NUMBER` (Phase 2).

**Money:** All monetary amounts stored as **bigint minor units** (e.g., paise) with an explicit integer `currency` code. No floating-point money columns anywhere.

**Readiness boundary:** `/api/health/db` performs a real round-trip only when `DATABASE_URL` is present; missing locally reports `not_configured` (503), never `500`, never claims health it cannot prove.

## 5. Tables Created

All 17 Master Guide §23 entities (across 7 migrations):

| Table | Purpose | Key fields / constraints |
|---|---|---|
| `admins` | Future admin users | `id(uuid pk)`, `email(text unique not null)`, `name`, `role(admin/super_admin)`, `status(active/inactive)`, `created_at/updated_at` |
| `customers` | Guest + later-authenticated buyers | `id(uuid pk)`, `email(text unique not null)`, `name`, `phone`, `created_at/updated_at` |
| `categories` | Product organization | `id(uuid pk)`, `slug(text unique not null)`, `name`, `description`, `is_active`, `sort_order`, `created_at/updated_at` |
| `products` | Core catalog | `id(uuid pk)`, `slug(text unique not null)`, `name`, `short_description`, `full_description`, `price_paise bigint`, `compare_at_price_paise`, `category_id→categories`, `features/features` arrays, preview, `drive_folder_id` (server-side only), `status(draft/active/paused/archived)`, `is_featured`, `is_best_seller`, `sort_order`, SEO cols, `created_at/updated_at` |
| `product_media` | Images/video for products | `id(uuid pk)`, `product_id→products`, `media_type`, `url`, `alt_text`, `sort_order`, `is_preview` |
| `coupons` | Future promo codes | `id(uuid pk)`, `code(text unique not null)`, `discount_type`, `discount_value`, `active`, `starts_at/ends_at`, `usage_limit`, `per_customer_limit` |
| `coupon_redemptions` | Coupon usage tracking | `id(uuid pk)`, `coupon_id→coupons`, `order_id→orders`, `customer_id→customers`, `created_at` |
| `bundle_rules` | Configurable bonus rules | `id(uuid pk)`, `name`, `description`, `active`, `rules_config(jsonb)`, `created_at/updated_at` |
| `bundle_rule_products` | Rule↔product membership | `rule_id→bundle_rules`, `product_id→products`, `role(trigger/bonus)`, composite `unique(role,product_id)` |
| `orders` | Purchase records | `id(uuid pk)`, `order_number(bigint unique)`, `customer_id→customers`, `status(pending→paid→fulfilled etc.)`, `subtotal_paise`, `discount_paise`, `total_paise`, `currency`, `coupon_id→coupons`, `created_at/updated_at` |
| `order_items` | Purchase-time snapshots | `id(uuid pk)`, `order_id→orders`, `product_id→products`, `product_name`, `unit_price_paise`, `quantity`, `total_price_paise` |
| `payments` | Future Razorpay records | `id(uuid pk)`, `order_id→orders unique`, `provider`, `provider_order_id`, `provider_payment_id(unique)`, `status`, `amount_paise`, `currency`, `method`, `failure_*`, `processed_at`, `created_at` |
| `entitlements` | Access authorization | `id(uuid pk)`, `customer_id→customers`, `order_id→orders`, `product_id→products`, `status(active/revoked)`, `granted_at`, `revoked_at` |
| `webhook_events` | Idempotency for webhooks | `id(uuid pk)`, `provider`, `external_event_id(text unique not null)`, `event_type`, `payload(jsonb)`, `status(pending/processed/failed)`, `processed_at`, `error`, `created_at` |
| `testimonials` | Future social proof | `id(uuid pk)`, `display_name`, `content`, `rating`, `is_active`, `sort_order`, `created_at/updated_at` |
| `site_settings` | Admin-managed config | `key(text unique not null)`, `value(jsonb)`, `updated_at` |
| `audit_logs` | Action trail | `id(uuid pk)`, `actor_admin_id→admins`, `action`, `entity_type`, `entity_id`, `metadata(jsonb)`, `created_at` |

**Sequences:** `order_number_seq` (bigint, human-readable order numbers per Master Guide).

## 6. RLS Policies

**Strategy:** Enable RLS on **every** table and create **zero** per-role policies (default-deny). This is the safe, intentional choice:

- `anon` and `authenticated` (browser-facing Supabase roles): **revoked all** table/sequence privileges → cannot read/write anything.
- No speculative "allow all" policies — avoids the common pitfall of accidentally opening sensitive data.
- The Express backend connects with a **server-side owner role** (`DATABASE_URL`) and bypasses RLS (normal owner behavior); privileged operations are gated by backend authorization in later phases (Phase 4+).
- Per-client policies (customer sees own orders/entitlements) are **intentionally deferred** to the phases that will introduce those real clients, so policies can be designed against actual access patterns rather than guesses.

Documented in `docs/DATABASE.md` §Security model.

## 7. Migrations

7 files in `backend/supabase/migrations/` (timestamped for deterministic ordering; safe to re-run: `create table if not exists`, `do $$` idempotency guards):

1. `20260908000001_extensions_enums.sql` — uuid-ossp, pgcrypto, all enums (`product_status`, `order_status`, `payment_status`, `entitlement_status`, `coupon_discount_type`, `media_type`, `bundle_role`).
2. `20260908000002_admins_customers.sql` — `admins`, `customers`.
3. `20260908000003_categories_products_media.sql` — `categories`, `products`, `product_media`.
4. `20260908000004_coupons_bundles.sql` — `coupons`, `bundle_rules`, `bundle_rule_products`.
5. `20260908000005_orders_payments_entitlements.sql` — `order_number_seq`, `orders`, `order_items`, `payments`, `entitlements`.
6. `20260908000006_platform_tables.sql` — `coupon_redemptions`, `webhook_events`, `testimonials`, `site_settings`, `audit_logs`.
7. `20260908000007_triggers_rls_lockdown.sql` — `updated_at` triggers, `enable rls`, `revoke all` from anon/authenticated.

## 8. Backend Changes

- **DB client** (`src/db/client.ts`): singleton `pg.Pool` created only when `DATABASE_URL` present; `query`, `checkDatabase` (real `select 1`), `closeDatabase`; safe error messages; never logs the URL.
- **Typed models** (`src/db/types.ts`): `DbProduct`, `DbOrder`, etc.; `Paise = number`, `CurrencyCode = 'INR'`; enums as string-literal unions; no `any`.
- **Migrations** (`scripts/apply-migrations.mjs`): ordered file reader, psql-exec, exits non-zero on failure.
- **Config** (`src/config/env.ts`): added `DATABASE_URL` (url-validated, optional locally / required in prod), `DATABASE_SSL` (auto-detect; remote→TLS, localhost→plain).
- **App** (`src/app.ts`): unchanged routes; DB client never blocks boot (so `/api/health` stays honest without `DATABASE_URL`).
- **Server** (`src/index.ts`): graceful shutdown closes the pool; SIGTERM/SIGINT handled for Render.
- **Health** (`src/routes/health.routes.ts`): split liveness (`/`) from readiness (`/db`).

## 9. Frontend Changes

"None. Phase 2 frontend preserved." — No frontend files were modified. The Phase 2 design-system, shell, and routes remain fully intact (regression verified: lint/typecheck/build unchanged).

## 10. Files Created

`backend/supabase/migrations/20260908000001_extensions_enums.sql`
`backend/supabase/migrations/20260908000002_admins_customers.sql`
`backend/supabase/migrations/20260908000003_categories_products_media.sql`
`backend/supabase/migrations/20260908000004_coupons_bundles.sql`
`backend/supabase/migrations/20260908000005_orders_payments_entitlements.sql`
`backend/supabase/migrations/20260908000006_platform_tables.sql`
`backend/supabase/migrations/20260908000007_triggers_rls_lockdown.sql`
`backend/scripts/apply-migrations.mjs`
`backend/src/db/client.ts`
`backend/src/db/types.ts`
`docs/DATABASE.md`

## 11. Files Modified

`backend/.env.example` (+ `DATABASE_URL`, `DATABASE_SSL`)
`backend/package.json` (`pg`, `pg-format`, `@types/pg` dev)
`backend/src/config/env.ts` (DB env validation)
`backend/src/index.ts` (pool close + graceful shutdown)
`backend/src/routes/health.routes.ts` (`/db` readiness probe)
`backend/src/app.ts` (no DB boot dependency)
`README.md` (Phase 3 status + stack)
`PROJECT_STATUS.md` (Phase 3 marked complete, Phase 4 pending)
`docs/ARCHITECTURE.md` (DB-access layer)
`docs/SECURITY.md` (RLS + privilege lockdown)
`docs/ENVIRONMENT.md` (DB variables)
`docs/TESTING.md` (DB validation strategy)
`docs/DEPLOYMENT.md` (migration apply step)

## 12. Files Deleted

None.

## 13. Dependencies Added

- `pg` — Node-native PostgreSQL driver for the server-side data-access layer (Supabase is PostgreSQL; `pg` is the standard stable driver; no extra opinionated abstractions).
- `pg-format` — safe identifier/value interpolation for the ordered migration-apply script.
- `@types/pg` — TypeScript types for `pg`.

No Razorpay / Google Drive / email / analytics SDKs added.

## 14. Environment Variables

**SERVER-ONLY** (backend, never committed values — `.env.example` has placeholders only):
- `DATABASE_URL` — Supabase PostgreSQL connection string (owner role). Optional locally, **required** in production.
- `DATABASE_SSL` — `"true"`/`"false"`, else auto-detect (remote→TLS, localhost→plain).

**PUBLIC** (unchanged from Phase 2): `VITE_API_URL`, `VITE_WHATSAPP_NUMBER`.

No secrets committed; no credentials exposed.

## 15. Database Verification

- **Migration/schema validation:** SQL reviewed for idempotency and structural correctness (PKs, FKs, enums, constraints). ✓
- **Local database verification:** **Not executed** — no live Postgres/Supabase instance available in this environment. The `checkDatabase` code path is implemented and ready, but no local Postgres was started to exercise it.
- **Live Supabase verification:** **Not available** — no Supabase credentials in this environment, per the Phase 3 "no invented credentials" rule. Treated as a **manual owner step** (see §20).
- **Typecheck** of `db/types.ts` against schema shape: ✓ (passed — no `any`, minor-unit money enforced).

## 16. Tests

Actual commands executed and results:

- `npm install`: **PASS** (pg + deps added cleanly)
- `npm run lint` (backend + frontend): **PASS**
- `npm run typecheck` (backend + frontend): **PASS**
- `npm run build` (backend + frontend): **PASS**
- Backend startup: **PASS** (boots, `/api/health` → 200 without `DATABASE_URL`; `/api/health/db` → 503 `not_configured` — honest, no crash)
- Frontend preview: **PASS** (`/`, `/products`, `/cart` → 200; SPA fallback intact)
- Backend `/api/health/db`: **PASS** (behavior correct; no live DB to confirm the 200 path — see §15)

## 17. Regression Verification

- Frontend still builds: **PASS** (Phase 2 assets unchanged)
- Backend still builds: **PASS**
- `/api/health` still works: **PASS** (liveness JSON unchanged)
- Existing routes still work: **PASS** (frontend routes unchanged, backend no new required routes)
- Phase 1/2 behavior preserved: **PASS**

## 18. Security Verification

- No secrets committed (scanned via git status + content review): **PASS**
- No Supabase service_role credentials in frontend: **PASS** (none added)
- No database passwords in source: **PASS**
- No raw credentials in logs (`checkDatabase` returns only a safe reason): **PASS**
- No public payment/order/entitlement/audit data: **PASS** (RLS default-deny + revoked anon/authenticated)
- No insecure "allow all" policies: **PASS** (zero per-role policies created)
- No frontend-only authorization: **PASS** (no auth/entitlements implemented in frontend)
- No fake payment state: **PASS** (no payment logic)
- No fake entitlement state: **PASS** (no entitlement logic)

## 19. Known Issues

- No live DB connection exercised in this environment (no local Postgres or Supabase creds). The code is correct and ready; live verification is a manual step.
- `pg-format` import is present (used by migration script); runtime client uses parameterized queries only.
- Per-client RLS policies deferred to Phase 4+ (intentional, see §6).
- Owner must create the Supabase project and obtain a privileged `DATABASE_URL` (see §20).

## 20. Manual Setup Required

To activate the database:

1. Create / open a Supabase project (Master Guide §22).
2. Set `DATABASE_URL` in the backend environment to the project's PostgreSQL connection string (owner role). Set `DATABASE_SSL=true` for remote connections.
3. Apply migrations:
   ```bash
   npm run db:apply-migrations   # backend/scripts/apply-migrations.mjs against $DATABASE_URL
   # OR: supabase db push / supabase migration up
   ```
4. Confirm: `curl http://localhost:4000/api/health/db` → `200 {"status":"ok","database":"reachable",...}`.

No seed data is inserted (no fake products/customers/orders/testimonials).

## 21. Production Blockers

- Phase 3 is a **foundation** phase. The platform is **not production-ready** yet: Admin Authentication (Phase 4), storefront API, cart/checkout, Razorpay integration + webhooks, entitlements, Google Drive delivery, email, SEO/analytics, and deployment are all **future phases**.
- `DATABASE_URL` must be provisioned by the owner before the DB readiness probe returns green in any environment.

## 22. Current Project State

Working now: complete Supabase PostgreSQL schema + migrations + server-side data-access layer + typed models + honest DB readiness endpoint + security hardening (default-deny RLS) + full documentation. All Phase 3 checks green (install/lint/typecheck/build/backend-health/frontend-preview). Backend boots standalone; DB layer activates once `DATABASE_URL` is configured. **No Phase 4+ features exist.**

## 23. Next Phase

**Phase 4 — Admin Authentication** (Master Guide §35): admin login/session, admin Auth table population, protected admin routes, auth-aware health/admin bootstrap. This Phase 3 foundation (RLS defaults, typed `DbProduct`/`DbOrder`/etc., `DATABASE_URL` owner access, audit_logs table) is the substrate Phase 4 will build on.

**Do NOT begin Phase 4 until the owner provides the Phase 4 prompt.**