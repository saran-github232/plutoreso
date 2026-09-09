# Architecture

> Baseline: [`docs/MASTER-GUIDE.md`](MASTER-GUIDE.md) (§30, §33, §56). This document describes the
> foundation **as it actually exists after Phase 1**. Nothing here overrides the Master Guide.

## Current architecture (Phase 1 — local development)

```text
        Browser (mobile-first PlutoReso shell)
                 │  HTTP fetch, JSON
                 ▼
   ┌───────────────────────────────┐
   │ Frontend  (Vite dev :5173)    │  React 19 + Vite 6 + Tailwind 4
   │ later: Vercel                 │
   └───────────────┬───────────────┘
                   │ /api/* JSON over HTTPS
                   ▼
   ┌───────────────────────────────┐
   │ Backend   (Express :4000)     │  Node 22 + Express 5
   │ later: Render                 │
   └───────────────┬───────────────┘
                   │  (future phases — not connected yet)
        ┌──────────┼───────────────────────┐
        ▼          ▼                       ▼
    Supabase     Razorpay              Google Drive
    PostgreSQL   Payments              (behind delivery layer)
    (Phase 3)    (Phase 8–9)           (Phase 10)
```

## Repository layout and responsibilities

| Path | Responsibility |
| --- | --- |
| `frontend/` | Storefront UI (Vercel target). Public configuration only. |
| `frontend/src/lib/admin-api.ts` | Admin catalog API client (Phase 5) — session-cookie fetch wrapper, product/category/media calls. |
| `frontend/src/pages/AdminProductsPage.tsx`, `AdminProductFormPage.tsx`, `AdminCategoriesPage.tsx` | Phase 5 admin catalog UI (list with search/filter/pagination, create/edit form with rupee→paise conversion, categories). |
| `frontend/src/components/ui/` | Design-system primitives (Button, Card, ProductCard, Drawer, Toast, states). |
| `frontend/src/components/layout/`, `home/` | Application shell (Header, Footer) and homepage sections. |
| `frontend/src/pages/`, `layouts/` | Route pages and SiteLayout (skip link → header → page → footer). |
| `frontend/src/types/`, `data/`, `config/` | Product type, clearly-marked sample data, public site config. |
| `backend/` | HTTP API (Render target). Owns all secrets, integrations, business rules. |
| `backend/src/config/env.ts` | zod-validated configuration; fail-fast startup. |
| `backend/src/app.ts` | Express app factory: security pipeline + route mounting. |
| `backend/src/routes/` | Route registry (`/api/health` today; future mounts documented inline). |
| `backend/src/validation/` | Phase 5 Zod schemas — product, category, product-media (body/query/param validation). |
| `backend/src/repositories/` | Phase 5 typed `pg` data-access — `product.repository.ts`, `category.repository.ts`, `product-media.repository.ts` (parameterized SQL, soft-lifecycle). |
| `backend/src/services/drive-url.service.ts` | Phase 5 pure service — validates Google Drive folder URLs, extracts folder IDs (no Drive API calls). |
| `backend/src/controllers/admin/` | Phase 5 admin controllers — product (auto-suffix create slugs, edit 409, status endpoint, archive-on-delete), category, media. |
| `backend/src/routes/admin.products.routes.ts` | Phase 5 admin route table — every route behind `requireAdmin`; mounted at `/api/admin` by `admin.routes.ts`. |
| `backend/src/middleware/` | Request logging; central error handling. |
| `docs/` | Master Guide (source of truth) + phase documentation + handoffs. |

## Frontend/backend boundary

- **One-directional communication:** the frontend calls the backend over HTTP(S) with JSON.
  The backend never calls the frontend.
- **Secret boundary:** the frontend contains no secrets; the only frontend env var is the public
  `VITE_API_URL`. All credentials, integrations, and business rules live server-side.
- **CORS:** explicit allowlist on the backend (`CLIENT_ORIGIN`, required in production).

## Frontend architecture (Phase 2) `/`, `/products`, `/products/:slug`, `/cart`,
  `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, `/refund-policy`, `/delivery-policy`,
  `/system-status`, `*` (404). Placeholder pages render honest "coming later" copy — no fake
  content is invented.
- **Layout** — `layouts/SiteLayout`: skip link → sticky Header (desktop nav + mobile Drawer) →
  `<main>` Outlet → Footer. Header/Footer are separate from any future admin shell.
- **Design system** — tokens in `src/index.css` (`@theme`); primitives in `src/components/ui/`;
  icons via `lucide-react`; fonts self-hosted (Inter + Sora variable). See
  [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).
- **Data boundary** — UI primitives are prop-driven. `Product` (`src/types/product.ts`) is the
  storefront projection of the Master Guide §3 model; sample data is isolated in
  `src/data/mock-products.ts` and clearly marked; the real catalog arrives via backend phases.
- **State** — URL state (router), local component state, and a Toast context. No global data
  layer yet; it arrives with the backend phases.
- **SPA hosting** — `frontend/vercel.json` contains SPA rewrites, prepared for the deployment
  phase (nothing is deployed yet).

## Backend request pipeline (as built)

```text
helmet (security headers) → CORS allowlist → JSON body parsing (100 kb limit)
  → request logger (no query strings) → /api routes → 404 handler → central error handler
```

- Configuration is validated at startup (zod); invalid config aborts the process with a clear message.
- Clients always receive safe, generic error messages; technical details are logged server-side only.
- Graceful shutdown on SIGTERM/SIGINT (Render-compatible).

## Environment boundaries

See [`ENVIRONMENT.md`](ENVIRONMENT.md). Backend = private secrets. Frontend = public config only.

## Future integration points (documented, NOT implemented)

| Integration | Phase | Boundary rules (Master Guide) |
| --- | --- | --- |
| Supabase PostgreSQL | 3 | DB is the source of truth for products, customers, orders, payments, entitlements, bundles, coupons, admins, webhook events, settings, audit logs. |
| Admin authentication | 4 | Server-side sessions, password hashing, rate limiting; backend authorization mandatory (never frontend-only). |
| Razorpay payments | 8 | Backend creates orders; server-side signature verification; never trust frontend payment success. |
| Razorpay webhooks | 9 | Raw body + signature validation, idempotency, single fulfillment, correct responses. |
| Google Drive delivery | 10 | Drive folder IDs validated/stored server-side; access only via verified entitlements; storage abstracted so it can be replaced (S3/R2) without rewriting commerce. |
| Email | 12 | Transactional provider credentials server-side only. |

## Architectural decisions recorded (Phase 1)

1. **npm-workspaces monorepo** (`frontend/`, `backend/`) — matches Master Guide §33 exactly.
2. **Express app factory** (`createApp`) — future phases extend the pipeline; no rewrite needed.
3. **ESM** (`"type": "module"`, NodeNext resolution, explicit `.js` import specifiers).
4. **zod-validated env config** — fail-fast; `CLIENT_ORIGIN` mandatory when `NODE_ENV=production`.
5. **Security defaults from day one** — helmet, CORS allowlist, body size limits, no stack traces
   to clients, log hygiene (no query strings), trust proxy for reverse proxies.
6. **Tailwind 4 with `@theme` tokens + system font stack** — fast, zero external font requests;
   the full premium design system is deferred to the design phase (per phase discipline).
7. **No storage/payment/DB code in Phase 1** — those integrate behind their defined boundaries in
   their own phases, keeping the foundation stable and honest.
