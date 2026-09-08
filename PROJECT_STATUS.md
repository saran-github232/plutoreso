# PlutoReso — Project Status

> This file always reflects the **actual** repository state. For rules and architecture, the source
> of truth is [`docs/MASTER-GUIDE.md`](docs/MASTER-GUIDE.md).

- **Project:** PlutoReso — digital-products e-commerce platform (India · INR · Razorpay · Google Drive delivery)
- **Current phase:** Phase 1 — Project Foundation ✅ (implemented and verified 2026-09-08)
- **Last updated:** 2026-09-08

## Current architecture

- npm-workspaces monorepo: `frontend/` (React 19 + Vite 6 + TypeScript strict + Tailwind 4) and
  `backend/` (Node 22 + Express 5 + TypeScript, ESM)
- Frontend → backend JSON over HTTP; CORS allowlist; all secrets server-side only
- Deployment targets (planned, not deployed): Vercel (frontend) · Render (backend)
- Supabase / Razorpay / Google Drive: **not connected yet** (their own phases)

## What existed before Phase 1

- Only `docs/MASTER-GUIDE.md`. Greenfield repository — no code, no git, no configs.

## Implemented in Phase 1

- [x] Repository structure per Master Guide §33 (`frontend/`, `backend/`, `docs/`, `README.md`, `.gitignore`, root `package.json`)
- [x] Frontend foundation: Vite + React 19 + strict TypeScript + Tailwind 4, ESLint 9 flat config
- [x] Mobile-first accessible app shell (Header, HomePage, Footer; skip link, semantic landmarks, visible focus states, reduced-motion support)
- [x] Public API client (`frontend/src/lib/api.ts`) + typed backend health-status card
- [x] Backend foundation: Express 5 app factory — helmet, CORS allowlist, 100 kb body limit,
      request logger (no query strings), 404 handler, central error handler (no stack traces to clients), graceful shutdown
- [x] zod-validated environment config; fail-fast startup; `CLIENT_ORIGIN` required in production
- [x] `GET /api/health` endpoint (public, no secrets)
- [x] Root scripts (workspaces): `dev`, `dev:backend`, `dev:frontend`, `build`, `lint`, `typecheck`, `start`
- [x] `.env.example` for both apps (placeholder names only); `.gitignore` excludes `.env*`, `node_modules/`, `dist/`, `.tools/`
- [x] Documentation: `README.md`, `docs/ARCHITECTURE.md`, `SECURITY.md`, `ENVIRONMENT.md`, `TESTING.md`, `DEPLOYMENT.md` (target-only), `docs/handoffs/STEP-01.md`
- [x] Portable Node.js v22.20.0 runtime provisioned at `.tools/` for this machine (gitignored; documented in README)

## Currently working

- `npm install`, `npm run lint`, `npm run typecheck`, `npm run build` — all pass (both workspaces)
- Backend starts, serves `/api/health` (200 JSON), correct 404 for unknown routes, 400 for malformed JSON
- Built frontend serves via `vite preview` (HTTP 200); shell renders; status card connects when backend runs

## Not yet implemented (per Master Guide §50)

- [ ] Phase 2 — Frontend design system / premium storefront UI
- [ ] Phase 3 — Supabase PostgreSQL schema + data layer
- [ ] Phase 4 — Admin authentication (server-side sessions)
- [ ] Phase 5 — Admin product management
- [ ] Phase 6 — Storefront catalog + product pages
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

No products, payments, admin panel, auth, or delivery exist yet — by design (Phase 1 scope).

## Known issues

- Node.js is not installed system-wide on this machine; the portable runtime in `.tools/`
  (gitignored) is used. The owner may install Node LTS normally and delete `.tools/`.
- No automated test framework yet — intentional Phase 1 scope (see `docs/TESTING.md`).
- Browser-based responsive/accessibility checks were verified via build + preview + code review;
  a human browser pass is still recommended.

## Known blockers

- None blocking Phase 2. GitHub remote does not exist yet — owner creates/connects it when ready
  (local git repository was initialized in Phase 1).

## Environment setup status

- `backend/.env.example` and `frontend/.env.example` created; no real `.env` files required yet;
  **no secrets exist anywhere in the repository**.

## Tests / build status (2026-09-08)

| Check | Result |
| --- | --- |
| `npm install` | PASS (292 packages) |
| `npm run lint` | PASS (backend + frontend) |
| `npm run typecheck` | PASS (backend + frontend, strict) — after fixing one unused-param error |
| `npm run build` | PASS (backend `dist/` + frontend `dist/`) |
| Backend runtime + `GET /api/health` | PASS (200, `{"status":"ok",...}`) |
| `GET /api/nonexistent` | PASS (404 JSON) |
| POST malformed JSON | PASS (400 JSON) |
| Built frontend served (`vite preview`) | PASS (HTTP 200, correct HTML) |

## Next recommended phase

**Phase 2 — Frontend Architecture & Design System** (premium UI foundation: design tokens,
typography pairing, component primitives, layout system) per Master Guide §50.
