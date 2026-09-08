# Database

> Baseline: [`MASTER-GUIDE.md`](MASTER-GUIDE.md) §23 (Supabase PostgreSQL as the source of truth).
> This document describes the **actual Phase 3 schema and access architecture**. Nothing here
> overrides the Master Guide.

## Status

- **Schema/migrations/access layer: created and code-verified** (lint/typecheck/build/runtime
  failure paths). See `docs/handoffs/STEP-03.md` §15 for exactly what was verified.
- **NOT yet applied to a live database.** No Supabase project or credentials existed during
  Phase 3, so no migration was executed against Supabase or any live Postgres. Applying them is a
  documented manual step (§migrations, §setup).

## Database choice

**Supabase PostgreSQL** (per Master Guide §23/§56) — the database is the source of truth for
products, customers, orders, payments, entitlements, bundles, coupons, admins, webhook events,
settings and audit logs. The backend connects **server-side** over plain Postgres (node-postgres
`pg` pool) using a privileged role. Supabase's PostgREST/anon surface is locked out entirely
(see §security).

## Connection architecture

```text
Express backend (Render, later)
  └── src/db/client.ts  (pg Pool, connection string from DATABASE_URL, TLS auto/explicit)
        └── Supabase PostgreSQL  ← only the backend ever holds credentials
Frontend (Vercel, later)  — NEVER holds database credentials; talks to the backend API only
```

- The pool is created **lazily**: the API boots honestly without `DATABASE_URL`
  (`/api/health/db` → 503 `not_configured`). In production `DATABASE_URL` is required (startup fails fast).
- TLS: `DATABASE_SSL=true|false` overrides; otherwise remote hosts get TLS, localhost does not.
- `/api/health` stays process-only; `/api/health/db` performs a real `select 1` and returns
  200 only when the database is genuinely reachable. Failure reasons are limited to
  `not_configured` / `unreachable` — never driver details.

## Conventions

- **IDs:** `uuid` primary keys, `default gen_random_uuid()` (pgcrypto).
- **Timestamps:** `timestamptz` everywhere; `created_at`/`updated_at` with `default now()`;
  `updated_at` maintained by the shared `set_updated_at()` trigger.
- **Money:** integer **minor units** (paise for INR) in `*_minor integer` columns with
  `>= 0` checks. Never floating point. `₹199.00` = `19900`. Frontend money formatting lives in
  `frontend/src/lib/money.ts` and consumes minor units — the representation is unambiguous on
  both sides. Currency is `text` with a `^[A-Z]{3}$` check (default `INR`).
- **Enums:** Postgres enums for fixed lifecycles (`product_status`, `order_status`,
  `payment_status`, `entitlement_status`); `text + CHECK` for smaller vocabularies
  (coupon discount type, bundle role, media type, webhook status/provider).
  New values later: `ALTER TYPE ... ADD VALUE` (never remove values).
- **Case-insensitive text:** `citext` for admin/customer emails and coupon codes.

## Key design decisions

1. **Customer uniqueness** — one identity per case-insensitive email (`citext unique`); guest
   checkout will upsert customers by email. `phone` is deliberately **not** unique (shared/family
   phones are a valid Indian pattern). `name` is nullable (email-first creation).
2. **Product lifecycle** — `status: active | inactive | archived` (default `inactive`). Products
   are never hard-deleted once they may be referenced by orders: `order_items.product_id` uses a
   restrictive FK, so historical rows block deletion; admin archives instead (Phase 5 workflow).
3. **Order numbers** — human-readable `PLT-YYYY-NNNNNN` from a dedicated Postgres sequence
   (`order_number_seq`, default expression) with a unique constraint. Bare UUIDs are never shown
   to customers as order references.
4. **Historical order integrity** — `order_items` snapshots `product_name_snapshot`,
   `product_slug_snapshot`, `unit_price_minor`, `compare_at_price_minor` at purchase time; a CHECK
   enforces `line_total = unit_price × quantity − line_discount`, and `orders` enforces
   `total = subtotal − discount` and `discount ≤ subtotal`. Duplicate product rows per order are
   impossible (`unique (order_id, product_id)`); extra units are `quantity`.
5. **Webhook idempotency** — `webhook_events` is unique on `(provider, fingerprint)` where the
   fingerprint is the SHA-256 of the raw body (covers providers without event IDs), plus a partial
   unique on `(provider, external_event_id)` when a provider supplies one.
6. **Entitlement idempotency** — `entitlements` is unique on `(order_id, product_id)`; the database
   itself prevents duplicate fulfilment. `granted_at` may only be written after server-side payment
   verification (Phase 10); nothing grants entitlements before then.
7. **Drive delivery separation** — `products.drive_folder_id` is the SERVER-ONLY delivery pointer
   (validated/extracted in a later phase). `product_media.url` is for public presentation assets
   only. Raw Drive URLs are never stored as public fields (Master Guide §5).

## Tables (17)

| Table | Purpose | Key fields / constraints |
| --- | --- | --- |
| `admins` | Admin accounts (auth arrives Phase 4) | `email` citext unique; `role` (owner/admin); `status` (active/disabled); `password_hash` nullable — hash only, never plaintext, never exposed |
| `customers` | Customer identities | `email` citext unique; `name`/`phone` nullable; phone not unique (decision above) |
| `categories` | Product organization | `slug` unique + URL-format CHECK; `is_active`, `sort_order` |
| `products` | Central catalog (Master Guide §3) | `slug` unique + format CHECK; `price_minor`/`compare_at_price_minor` integer checks; `category_id` FK SET NULL; `features`/`benefits` jsonb; `drive_folder_id` server-only; `status` enum; featured/best-seller/sort/SEO fields |
| `product_media` | Public presentation media | `product_id` FK CASCADE; `media_type` (image/video/preview); public `url`, `alt_text`, `sort_order` |
| `orders` | Customer orders | `order_number` unique default `PLT-YYYY-NNNNNN`; `customer_id` FK; `status` order_status; subtotal/discount/total minor-unit invariant CHECKs; `coupon_id` FK SET NULL |
| `order_items` | Purchase-time line items | `order_id` FK CASCADE; `product_id` FK restrictive; name/slug/price snapshots; `quantity ≥ 1`; `line_total` invariant CHECK; `unique (order_id, product_id)` |
| `payments` | Provider payment records (Razorpay later) | `order_id` FK; `provider` CHECK; partial unique `(provider, provider_order_id)` / `(provider, provider_payment_id)`; `status` enum; non-sensitive `method`/`error_*`; `raw_metadata` jsonb |
| `entitlements` | Verified access grants (used Phase 10) | customer/order/product FKs; `status` enum; `granted_at`/`revoked_at` sanity CHECK; **`unique (order_id, product_id)`** |
| `coupons` | Admin-configured coupon definitions | `code` citext unique; discount type/value CHECK (1–100 % or >0 fixed); validity-window CHECK; usage-limit fields; `min_order_amount_minor` |
| `coupon_redemptions` | Usage tracking | FKs to coupon/order/customer; `discount_minor`; `unique (coupon_id, order_id)` |
| `bundle_rules` | Configurable bundle/bonus rules | `conditions` jsonb (app-validated); active flag; optional campaign window |
| `bundle_rule_products` | Rule membership | `role` (trigger/bonus); `quantity ≥ 1`; `unique (rule_id, product_id, role)` |
| `webhook_events` | Idempotent webhook log (Phase 9) | `unique (provider, fingerprint)`; partial unique on external id; `status`/`processed_at`/`error_message` |
| `testimonials` | Admin-managed social proof | `author_name`, `content`, `rating` 1–5 CHECK; `is_active` default **false**; optional `customer_id` attribution |
| `site_settings` | Admin-managed key/value config | `key` PK; `value` jsonb; **never a secret vault** |
| `audit_logs` | Admin/system action trail | `actor_admin_id` FK SET NULL; dot-namespaced `action`; `entity_type`/`entity_id`; `metadata` jsonb; `ip_address` |

## Indexes

Beyond unique constraints: storefront partial indexes on `products` (`sort_order where
status='active'`, plus featured/best-seller variants), FK lookup indexes (orders→customer,
order_items→order, payments→order, entitlements→customer/product, product_media→product,
bundle/coupon/redemption lookups), recent-first admin indexes (`orders_created_idx`,
`audit_logs_created_idx`), and `webhook_events_unprocessed_idx` for retry scans. No speculative indexes.

## RLS / security model

- **RLS is ENABLED on all 17 tables with ZERO policies → default deny.** Supabase's
  `anon`/`authenticated` (PostgREST) can neither read nor write anything.
- **No "allow all" policies exist** and none are created "for convenience".
- Belt-and-braces `REVOKE ALL … FROM anon, authenticated` on every table and on
  `order_number_seq` (removes Supabase's default grants to browser-facing roles).
- The **backend bypasses RLS by design**: it connects server-side as the privileged role from
  `DATABASE_URL` (server-only, like any table owner). That credential never reaches the frontend.
- Per-client policies (e.g. "customer reads own orders/entitlements") are **intentionally
  deferred** to Phase 4+/10 when those clients actually exist — designed then, against real
  access patterns, and documented here.
- Additional layers: all access is parameterized (`db/client.ts query()` — never interpolated
  SQL), CHECK/FK/unique constraints are the final integrity guard, and `admins.password_hash`,
  `products.drive_folder_id`, and payment internals are never exposed through any API
  (no such API exists yet).

## Migrations

Files live in `backend/supabase/migrations/` (Supabase CLI convention), applied in filename
order and tracked in `schema_migrations`:

| File | Contents |
| --- | --- |
| `20260908000001_extensions_enums.sql` | pgcrypto + citext; 4 lifecycle enums; `set_updated_at()` |
| `20260908000002_admins_customers.sql` | `admins`, `customers` |
| `20260908000003_categories_products_media.sql` | `categories`, `products` (+ indexes), `product_media` |
| `20260908000004_coupons_bundles.sql` | `coupons`, `bundle_rules`, `bundle_rule_products` |
| `20260908000005_orders_payments_entitlements.sql` | `order_number_seq`; orders/items/payments/entitlements/redemptions |
| `20260908000006_platform_tables.sql` | `webhook_events`, `testimonials`, `site_settings`, `audit_logs` |
| `20260908000007_triggers_rls_lockdown.sql` | 11 `updated_at` triggers; RLS everywhere; anon/authenticated revokes |

Apply options:

1. **Tracked script (recommended):** `npm run db:migrate` (in `backend/`) — applies pending files,
   each in a transaction, recorded in `schema_migrations`. Requires `DATABASE_URL`.
2. **Supabase CLI:** `supabase db push` (link the project; it reads the same folder).
3. Manual `psql -f` per file works but is not tracked — avoid.

## Setup checklist (owner, once the Supabase project exists)

1. Create the Supabase project (region near India, e.g. Mumbai/Singapore).
2. Copy the **pooler** connection string into `backend/.env` as `DATABASE_URL`
   (never commit it — `backend/.env.example` documents the shape only).
3. Run `npm run db:migrate` (or `supabase db push`).
4. Verify: `GET /api/health/db` must return **200** `{"database":"reachable",...}`.
5. Optionally generate typed clients later (`supabase gen types typescript`) to supplement
   `backend/src/db/types.ts` — do not fabricate generated output before then.

## Production considerations

- Use the **Supavisor pooler** connection string for the backend; the app's pool is small
  (`max: 10`). TLS is automatic for remote hosts (`DATABASE_SSL` can force it).
- **Backups:** enable Supabase PITR/backups before real revenue (Master Guide §47) — free tiers
  are not a backup strategy. Migration files remain the schema's source of truth for recovery.
- `webhook_events.payload` grows over time — add a retention policy when Phase 9 lands.

## Future migration notes

- Adding enum values: `ALTER TYPE ... ADD VALUE` in a new migration; never edit applied files.
- Customer-facing RLS policies (Phase 4+/10): add per-table policies in new migrations, keep
  default-deny everywhere else, re-verify the anon surface after every change.
- Keep `backend/src/db/types.ts` aligned with migrations until generated types are adopted.


