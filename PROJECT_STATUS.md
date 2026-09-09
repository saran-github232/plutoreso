# PlutoReso — Project Status

> This file always reflects the **actual** repository state. For rules and architecture, the source
> of truth is [`docs/MASTER-GUIDE.md`](docs/MASTER-GUIDE.md).

- **Project:** PlutoReso — digital-products e-commerce platform (India · INR · Razorpay · Google Drive delivery)
- **Current phase:** Phase 7 — Cart & Checkout ✅ (implemented and verified 2026-09-10)
- **Last updated:** 2026-09-10

## Current architecture

- npm-workspaces monorepo: `frontend/` (React 19 + Vite 6 + TypeScript strict + Tailwind 4 +
  React Router + lucide icons + self-hosted Inter/Sora fonts) and `backend/` (Node 22 + Express 5
  + TypeScript, ESM)
- Frontend → backend JSON over HTTP; CORS allowlist; all secrets server-side only
- Design system: tokens in `frontend/src/index.css` (`@theme`), primitives in
  `frontend/src/components/ui/` — see `docs/DESIGN_SYSTEM.md`
- Deployment targets (planned, not deployed): Vercel (frontend, SPA rewrites prepared) · Render (backend)
- Supabase / Razorpay / Google Drive: **not connected yet** (their own phases)

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
- [x] UI primitives: Button (6 variants × 3 sizes + loading), IconButton, Badge, Card, Container,
      Section, Skeleton, EmptyState, ErrorState, PriceDisplay (INR, minor units), Divider, Input,
      Textarea, Select, Checkbox, FormField, Drawer, Toast, Spinner, ProductCard(+Skeleton),
      ProductGrid
- [x] Routing foundation (react-router-dom): `/`, `/products`, `/products/:slug`, `/cart`,
      `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, `/refund-policy`, `/delivery-policy`,
      `/system-status`, `*` (404) — placeholders carry honest "coming later" copy
- [x] Application shell: sticky responsive Header (desktop nav + mobile Drawer), Footer with
      future-ready link groups, SiteLayout with skip link
- [x] Homepage foundation per Master Guide §7: dark premium Hero, value props, featured products,
      best sellers, bundles teaser, why-PlutoReso, honest social-proof placeholder, FAQ preview
      (native details), WhatsApp CTA (config-driven, "coming soon" until number supplied)
- [x] Product grid + cards driven by clearly-marked mock data (`src/data/mock-products.ts`) —
      real catalog arrives via backend phases
- [x] `frontend/vercel.json` SPA rewrites prepared (deployment phase, not deployed)

### Phase 3 — Database & Backend Foundation ✅ (2026-09-08)

- [x] Supabase PostgreSQL schema: 17 tables, 7 ordered idempotent migrations;
      `pg` data-access layer, typed models, `/api/health/db` readiness;
      money in minor units; restrictive `order_items.product_id`; RLS
      default-deny (see `docs/handoffs/STEP-03.md`, `docs/DATABASE.md`)

### Phase 4 — Admin Authentication ✅ (2026-09-08, `eb73a42`)

- [x] Argon2id passwords, server-side sessions (SHA-256 token hashes,
      HttpOnly cookie), `requireAdmin`/`requireRole`, rate-limited login,
      logout, `/api/admin/me`, audit logging, bootstrap script, frontend
      AuthContext + `/admin/login` + guarded `/admin`, 16 vitest tests
      (see `docs/handoffs/STEP-04.md`, `docs/AUTHENTICATION.md`)

### Phase 7 — Cart & Checkout ✅ (2026-09-10)

- [x] Centralized cart state (`CartContext`) with versioned localStorage persistence, corrupted-data recovery, and no payment credentials/secrets ever stored
- [x] Cart add/remove/clear, duplicate prevention, server-supplied display snapshot (priceMinor, currency, image)
- [x] Cart page: authoritative revalidation against DB prices, unavailable-item removal, price-change flags, subtotal, empty state, checkout CTA
- [x] Checkout page: name/email/phone collection, client-side validation, server-authoritative PENDING order creation
- [x] Backend checkout endpoints: `POST /api/checkout/validate` (cart revalidation) + `POST /api/checkout/prepare` (order creation)
- [x] Server-authoritative pricing: integer minor units (paise) from DB, browser never trusted for money
- [x] Product validation: active-only, reject unavailable products, authoritative line/subtotals
- [x] Order foundation: PENDING status only, order_items snapshots (name, slug, unit_price, line_total), no payment created
- [x] Customer upsert by email (citext), idempotency-safe dedupe via `client_request_id`
- [x] Explicit DTOs: `PublicOrder`, `PublicOrderItem`, `PublicValidatedCart` — raw DB rows never returned
- [x] drive_folder_id never exposed in checkout responses
- [x] 29 new checkout tests; total **96/96**; typecheck, lint, build all green

### Phase 6 — Storefront / Product Pages ✅ (2026-09-09)

- [x] Public catalog API (`/api/products`, `/api/products/:slug`, `/api/categories`) — active products only, customer-safe DTOs
- [x] Live product listing (search/category/sort/pagination), product detail (gallery, benefits, features, preview), homepage featured/best-seller rows
- [x] Mock-data file no longer imported by any page (design-system fixture only)

### Phase 5 — Admin Product Management ✅ (2026-09-09)

- [x] Zod validation (product/category/media body/query/param schemas)
- [x] Typed `pg` repositories (products with search/filter/pagination/sort,
      categories, media); parameterized SQL; no hard-delete product path
- [x] Pure Drive folder URL service — validate + extract folder ID, store
      only `products.drive_folder_id`, never the raw URL
- [x] Admin controllers + routes: products CRUD, `PATCH :id/status`,
      `DELETE :id` = archive, media CRUD, categories CRUD — all `requireAdmin`
- [x] Slug conflicts: create auto-suffixes (`-2`, `-3`, … bounded), edit → 409
- [x] Audit: `product.create/edit/archive/status-change`,
      `category.create/edit`, `media.create/edit/delete`
- [x] Frontend: `lib/admin-api.ts`, `/admin/products` list (search/filter/
      pagination/activate/archive), `/admin/products/new` + `/:id/edit` form
      (rupees → paise at boundary, all Master Guide fields),
      `/admin/categories` (create/edit/activate) — Phase 2 design system
- [x] 39 new tests (validation 20 + drive-url 19); Phase 4 suite green; total **55/55**; zero new migrations; no new dependencies
      (see `docs/handoffs/STEP-05.md`, `docs/API_CONTRACT.md`)

## PARTIALLY COMPLETED

- **Product UI:** production-ready primitives fed by live catalog data (Phase 6/7).
- **WhatsApp CTA:** UI + config boundary exist; no number configured until the business provides one.

## NOT STARTED (per Master Guide §50)

- [ ] Phase 8 — Razorpay integration
- [ ] Phase 9 — Webhooks + payment verification
- [ ] Phase 10 — Entitlements + Google Drive delivery
- [ ] Phase 11 — Bundles / bonuses / coupons
- [ ] Phase 12 — Email notifications
- [ ] Phase 13 — SEO & analytics (Meta Pixel)
- [ ] Phase 14 — Security hardening (rate limiting, etc.)
- [ ] Phase 15 — Automated test suite
- [ ] Phase 16 — Deployment (Vercel + Render)
- [ ] Phases 17–19 — Production verification, Meta tracking, launch optimization

Admin panel (login + product/category/media management), auth (server sessions),
and catalog data layer exist; storefront still uses sample data until Phase 6;
payments/delivery/email are later phases by design.

## KNOWN ISSUES

- Node.js is not installed system-wide on this machine; the portable runtime in `.tools/`
  (gitignored) is used. The owner may install Node LTS normally and delete `.tools/`.
- No automated test framework yet — intentional scope so far (see `docs/TESTING.md`).
- No real-browser visual, axe, or Lighthouse verification has been performed — Phase 2 was
  verified via build, preview server checks, and code review. A human browser pass is recommended.
- The design system's dark-hero/footer styling uses `slate-950` with light text; a full dark mode
  does not exist (single light theme is intentional for Phase 2).

## PRODUCTION BLOCKERS

- No backend database/payments/authentication/delivery yet (later phases by design).
- Policy page content not drafted yet — required before Razorpay live activation (Master Guide §28).
- GitHub remote not connected (owner action).
- WhatsApp support number not configured (owner action — `VITE_WHATSAPP_NUMBER`).

## Environment setup status

- `backend/.env.example` and `frontend/.env.example` created; no real `.env` files required yet;
  **no secrets exist anywhere in the repository**.

## Tests / build status (2026-09-10, after Phase 7)

| Check | Result |
| --- | --- |
| Backend `npx tsc --noEmit` | PASS (exit 0) |
| Frontend `npx tsc -b` | PASS (exit 0) |
| `npm run lint` (backend + frontend) | PASS (exit 0) |
| `npm run build` (backend tsc + frontend vite) | PASS (JS ~345 kB → 102 kB gzip, CSS ~45 kB → 9 kB gzip) |
| Backend `npx vitest run` | PASS — 96/96 (checkout 29, catalog 12, drive-url 19, validation 20, auth 16) |
| Backend runtime + `GET /api/health` | PASS (200 JSON); `GET /api/admin/products` unauthenticated → 401 |
| Live Supabase verification | BLOCKED — no credentials in this environment (owner action) |

## NEXT PHASE

**Phase 8 — Razorpay Integration** (payment provider integration, order creation, payment verification, webhook handling) per Master Guide §50. Phase 7 is committed; do not begin Phase 8 until the owner provides the Phase 8 prompt.
