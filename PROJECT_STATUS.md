# PlutoReso — Project Status

> This file always reflects the **actual** repository state. For rules and architecture, the source
> of truth is [`docs/MASTER-GUIDE.md`](docs/MASTER-GUIDE.md).

- **Project:** PlutoReso — digital-products e-commerce platform (India · INR · Razorpay · Google Drive delivery)
- **Current phase:** Phase 2 — Frontend Architecture & Design System ✅ (implemented and verified 2026-09-08)
- **Last updated:** 2026-09-08

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

## PARTIALLY COMPLETED

- **Storefront pages:** routing + homepage foundation + catalog preview exist; product detail,
  cart, about/FAQ/contact and policy pages are honest placeholders pending backend/content phases.
- **Product UI:** production-ready primitives, but fed by clearly-marked sample data until the
  backend catalog exists (Phase 3/6).
- **WhatsApp CTA:** UI + config boundary exist; no number configured until the business provides one.

## NOT STARTED (per Master Guide §50)

- [ ] Phase 3 — Supabase PostgreSQL schema + data layer
- [ ] Phase 4 — Admin authentication (server-side sessions)
- [ ] Phase 5 — Admin product management
- [ ] Phase 6 — Storefront catalog + product pages (real data)
- [ ] Phase 7 — Cart & checkout
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

No products, payments, admin panel, auth, or delivery exist yet — by design (phase scope).

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

## Tests / build status (2026-09-08, after Phase 2)

| Check | Result |
| --- | --- |
| `npm install` (with Phase 2 deps) | PASS (added 7 packages) |
| `npm run lint` | PASS (backend + frontend) |
| `npm run typecheck` | PASS (backend + frontend, strict) |
| `npm run build` | PASS (backend `dist/` + frontend `dist/`; JS 277 kB → 86 kB gzip, CSS 39 kB → 8.2 kB gzip) |
| Backend runtime + `GET /api/health` | PASS (regression check, 200 JSON) |
| Frontend `/`, `/products`, `/products/:slug`, `/cart` via `vite preview` | PASS (all HTTP 200, SPA fallback works) |

## NEXT PHASE

**Phase 3 — Database & Backend Foundation** (Supabase PostgreSQL schema + backend data layer) per
Master Guide §50. Do not begin until the owner provides the Phase 3 prompt.
