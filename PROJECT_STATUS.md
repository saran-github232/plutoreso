# PlutoReso — Project Status

> This file always reflects the **actual** repository state. For rules and architecture, the source
> of truth is [`docs/MASTER-GUIDE.md`](docs/MASTER-GUIDE.md).

- **Project:** PlutoReso — digital-products e-commerce platform (India · INR · Razorpay · Google Drive delivery)
- **Current phase:** Phase 8 — Razorpay Integration ✅ (implemented and verified 2026-09-10)
- **Last updated:** 2026-09-10

## Current architecture

- npm-workspaces monorepo: `frontend/` (React 19 + Vite 6 + TypeScript strict + Tailwind 4 +
  React Router + lucide icons + self-hosted Inter/Sora fonts) and `backend/` (Node 22 + Express 5
  + TypeScript, ESM)
- Frontend → backend JSON over HTTP; CORS allowlist; all secrets server-side only; the Razorpay
  Key Secret never leaves the backend and only the Razorpay Key ID is exposed to the browser
- Design system: tokens in `frontend/src/index.css` (`@theme`), primitives in
  `frontend/src/components/ui/` — see `docs/DESIGN_SYSTEM.md`
- Deployment targets (planned, not deployed): Vercel (frontend, SPA rewrites prepared) · Render (backend)
- Supabase database: connections ready but no live credentials configured in this environment
  (owner action). Razorpay: integration implemented, credentials configurable via env, Test/Live.
  Google Drive delivery is Phase 10 (not started).

## What existed before Phase 1

- Only `docs/MASTER-GUIDE.md`. Greenfield repository — no code, no git, no configs.

## COMPLETED

### Phase 1 — Project Foundation ✅ (2026-09-08)

- [x] Repository structure per Master Guide §33; npm workspaces; root scripts
- [x] Frontend foundation (Vite + React + strict TS + Tailwind 4), ESLint, backend foundation
      (Express 5 factory, helmet, CORS allowlist, size limits, logging, error handling, `/api/health`)
- [x] zod-validated env config; `.env.example` files; `.gitignore`; documentation set
- [x] Portable Node v22.20.0 runtime at `.tools/` (machine-only, gitignored)

### Phase 2 — Frontend Architecture & Design System ✅ (2026-09-08)

- [x] Design tokens: color/semantic roles, typography pairing (Sora + Inter), spacing, radii,
      shadows, motion keyframes — all centralized in `index.css` (`@theme`), documented in
      `docs/DESIGN_SYSTEM.md`
- [x] UI primitives: Button, IconButton, Badge, Card, Container, Section, Skeleton, EmptyState,
      ErrorState, PriceDisplay (INR, minor units), Divider, Input, Textarea, Select, Checkbox,
      FormField, Drawer, Toast, Spinner, ProductCard(+Skeleton), ProductGrid
- [x] Routing foundation (react-router-dom): `/`, `/products`, `/products/:slug`, `/cart`,
      `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, `/refund-policy`, `/delivery-policy`,
      `/system-status`, `*` (404) — placeholders carry honest "coming later" copy
- [x] Application shell: sticky responsive Header (desktop nav + mobile Drawer), Footer with
      future-ready link groups, SiteLayout with skip link
- [x] Homepage foundation per Master Guide §7: dark premium Hero, value props, featured products,
      best sellers, bundles teaser, why-PlutoReso, honest social-proof placeholder, FAQ preview
      (native details), WhatsApp CTA (config-driven, "coming soon" until number supplied)
- [x] Product grid + cards driven by mock data (Phase 2) → later replaced by live catalog (Phase 6)
- [x] `frontend/vercel.json` SPA rewrites prepared (deployment phase, not deployed)

### Phase 3 — Database & Backend Foundation ✅ (2026-09-08)

- [x] Supabase PostgreSQL schema: 17 tables, 7 ordered idempotent migrations;
      `pg` data-access layer, typed models, `/api/health` + `/api/health/db` readiness;
      money in minor units; restrictive `order_items.product_id`; RLS default-deny
      (see `docs/handoffs/STEP-03.md`, `docs/DATABASE.md`)

### Phase 4 — Admin Authentication ✅ (2026-09-08, `eb73a42`)

- [x] Argon2id passwords, server-side sessions (SHA-256 token hashes, HttpOnly cookie),
      `requireAdmin`/`requireRole`, rate-limited login, logout, `/api/admin/me`, audit logging,
      bootstrap script, frontend AuthContext + `/admin/login` + guarded `/admin`, 16 tests
      (see `docs/handoffs/STEP-04.md`, `docs/AUTHENTICATION.md`)

### Phase 5 — Admin Product Management ✅ (2026-09-09)

- [x] Zod validation (product/category/media body/query/param schemas)
- [x] Typed `pg` repositories (products with search/filter/pagination/sort, categories, media);
      parameterized SQL; no hard-delete product path
- [x] Pure Drive folder URL service — validate + extract folder ID, store only
      `products.drive_folder_id`, never the raw URL
- [x] Admin controllers + routes: products CRUD, `PATCH :id/status`, `DELETE :id` = archive,
      media CRUD, categories CRUD — all `requireAdmin`
- [x] Slug conflicts: create auto-suffixes (`-2`, `-3`, … bounded), edit → 409
- [x] Audit: `product.create/edit/archive/status-change`, `category.create/edit`, `media.*`
- [x] Frontend: `lib/admin-api.ts`, /admin/products list (search/filter/pagination/activate/
      archive), /admin/products/new + /:id/edit form (rupees → paise at boundary),
      /admin/categories (create/edit/activate) — Phase 2 design system
- [x] 39 new tests (validation 20 + drive-url 19); Phase 4 suite green; no new migrations
      (see `docs/handoffs/STEP-05.md`, `docs/API_CONTRACT.md`)
### Phase 6 — Storefront / Product Pages ✅ (2026-09-09)

- [x] Public catalog API (`/api/products`, `/api/products/:slug`, `/api/categories`) — active
      products only, customer-safe DTOs
- [x] Live product listing (search/category/sort/pagination), product detail (gallery, benefits,
      features, preview), homepage featured/best-seller rows
- [x] Mock-data file no longer imported by any page (design-system fixture only)

### Phase 7 — Cart & Checkout ✅ (2026-09-10)

- [x] Centralized cart state (`CartContext`) with versioned localStorage persistence,
      corrupted-data recovery, and no payment credentials/secrets ever stored
- [x] Cart add/remove/clear, duplicate prevention, server-supplied display snapshot
- [x] Cart page: authoritative revalidation against DB prices, unavailable-item removal,
      price-change flags, subtotal, empty state, checkout CTA
- [x] Checkout page: name/email/phone collection, client-side validation, server-authoritative
      PENDING order creation
- [x] Backend checkout endpoints: `POST /api/checkout/validate` + `POST /api/checkout/prepare`
- [x] Server-authoritative pricing: integer minor units (paise) from DB; browser never trusted
- [x] Product validation: active-only, reject unavailable products
- [x] Order foundation: PENDING only; order_items snapshots (name/slug/unit_price/line_total)
- [x] Customer upsert by email (citext); idempotency-safe dedupe via `client_request_id`
- [x] Explicit DTOs (`PublicOrder`, `PublicOrderItem`, `PublicValidatedCart`) — no raw DB rows,
      no `drive_folder_id`
- [x] 31 checkout tests (see `docs/handoffs/STEP-07.md`)

### Phase 8 — Razorpay Integration ✅ (2026-09-10)

- [x] Server-side Razorpay order creation (`POST /api/payments/razorpay/order`)
- [x] Razorpay Standard Checkout integrated into CheckoutPage
- [x] Amount sourced from the authoritative local order in PostgreSQL (integer paise);
      browser never supplies the amount
- [x] Razorpay Key ID exposed to frontend; Key Secret server-only and never logged
- [x] Local order ↔ Razorpay order mapping via the existing `payments` table
- [x] Payment state remains `created` and the local order stays `PAYMENT_INITIATED` — NOT paid
- [x] Idempotency: reuses an existing Razorpay payment for the same order on retry
- [x] Safe Razorpay script loader hook (no duplicate injection)
- [x] Browser success callback shows "submitted, awaiting verification" — NOT treated as paid
- [x] Test/Live mode via environment configuration (no credentials committed)
- [x] Razorpay service isolated with error normalization (no provider-internal leakage)
- [x] 12 new payment tests; **total 110/110** backend tests; typecheck, lint, build all green
- [x] Phase 9 boundary honoured: no HMAC/verification endpoint, no webhooks, no entitlements,
      no Google Drive delivery (see `docs/handoffs/STEP-08.md`)

## NOT STARTED (per Master Guide §50)

- [ ] Phase 9 — Webhooks + payment verification
- [ ] Phase 10 — Entitlements + Google Drive delivery
- [ ] Phase 11 — Bundles / bonuses / coupons
- [ ] Phase 12 — Email notifications
- [ ] Phase 13 — SEO & analytics (Meta Pixel)
- [ ] Phase 14 — Security hardening (rate limiting, etc.)
- [ ] Phase 15 — Automated test suite
- [ ] Phase 16 — Deployment (Vercel + Render)
- [ ] Phases 17–19 — Production verification, Meta tracking, launch optimization

## KNOWN ISSUES

- Node.js is not installed system-wide on this machine; the portable runtime in `.tools/`
  (gitignored) is used. The owner may install Node LTS normally and delete `.tools/`.
- No real-browser visual, axe, or Lighthouse verification has been performed — verified via
  build, preview server checks, and code review. A human browser pass is recommended.
- The design system's dark-hero/footer styling uses `slate-950` with light text; a full dark mode
  does not exist (single light theme is intentional).
- A customer who abandons payment leaves the local order `PENDING` / `PAYMENT_INITIATED`; stale
  Razorpay orders are reconciled/expired by Phase 9 webhooks and reconciliation.

## Tests / build status (2026-09-10, after Phase 8)

| Check | Result |
| --- | --- |
| Backend `npx tsc --noEmit` | PASS (exit 0) |
| Frontend `npx tsc -b` | PASS (exit 0) |
| `npm run lint` (backend + frontend) | PASS (exit 0) |
| `npm run build` | PASS (backend tsc + frontend vite; JS ~350 kB → 103 kB gzip) |
| Backend `npx vitest run` | PASS — 110/110 (payment 12, checkout 31, catalog 12, drive-url 19, validation 20, auth 16) |
| Backend runtime + `GET /api/health` | PASS (200 JSON); `GET /api/admin/products` unauth → 401 |
| Live Supabase / live Razorpay Test payment | BLOCKED — no credentials in this environment (owner action) |

## PRODUCTION BLOCKERS

- Policy page content not drafted yet — required before Razorpay live activation (Master Guide §28).
- GitHub remote connectivity/ownership — push succeeded for prior phases; confirm before deploy.
- WhatsApp support number not configured (owner action — `VITE_WHATSAPP_NUMBER`).
- No live Supabase credentials, Razorpay Test/Live keys, or SMTP keys configured by the owner yet.

## Environment setup status

- `backend/.env.example` and `frontend/.env.example` created; no real `.env` files committed;
  **no secrets exist anywhere in the repository**. Razorpay keys are configured via environment.

## NEXT PHASE

**Phase 9 — Webhooks + Payment Verification** per Master Guide §50. Phase 8 is committed;
do not begin Phase 9 until the owner provides the Phase 9 prompt.
