# Testing & Verification

> Baseline: [`docs/MASTER-GUIDE.md`](MASTER-GUIDE.md) §51. Actual verification results per phase are
> recorded in [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) and [`handoffs/`](handoffs/).

## Current state

There is **no automated test suite yet** — Phase 1 is foundation-only, and per phase discipline
tests arrive with the features they cover (Master Guide §51). Do not mistake this for a gap in the
foundation: lint, typecheck, build, and runtime checks below are the Phase 1 quality gates.

## Phase 1 verification commands (from repo root)

```bash
npm install            # workspaces: frontend + backend
npm run lint           # ESLint, both workspaces
npm run typecheck      # TypeScript strict, both workspaces
npm run build          # backend tsc build → backend/dist, frontend tsc+vite build → frontend/dist
```

Runtime checks:

- Backend: `npm run dev:backend` (or `npm run build && npm run start`) →
  `GET http://localhost:4000/api/health` must return HTTP 200 JSON with `status: "ok"`.
- Frontend: `npm run dev:frontend` → `http://localhost:5173` must render the app shell;
  the System status card should show **Connected** when the backend is running.

## Phase 2 verification (2026-09-08)

- `npm install` (adds react-router-dom, lucide-react, 2 fontsource packages): PASS
- `npm run lint`: PASS (both workspaces)
- `npm run typecheck`: PASS (both workspaces, strict)
- `npm run build`: PASS — frontend JS 277 kB (86 kB gzip), CSS 39 kB (8.2 kB gzip), fonts split
  into lazy unicode-range subsets; backend build unchanged and passing
- Backend regression: `GET /api/health` → 200 JSON PASS
- Built frontend via `vite preview`: `/` → 200 with PlutoReso markup; `/products`,
  `/products/:slug`, `/cart` → all 200 (SPA fallback verified)
- Limitation: no real-browser session was available — responsive rendering, console cleanliness,
  and screen-reader behavior were verified via build + preview + code review only (see PROJECT_STATUS).

## Phase 3 verification (2026-09-08)

- `npm install` (adds `pg`, `@types/pg`, `globals`): PASS
- `npm run lint`: PASS (first run caught missing Node globals for the `.mjs` script — fixed by
  adding `globals.node` to the backend ESLint config; re-run PASS)
- `npm run typecheck`: PASS (both workspaces, strict)
- `npm run build`: PASS — backend compiles `src/db/*`; frontend rebuild unchanged (86 kB gzip JS)
- `/api/health`: PASS (200, process health — unchanged semantics)
- `/api/health/db` **without** `DATABASE_URL`: PASS — 503 `{"database":"not_configured"}` (honest)
- `/api/health/db` **with** a dummy local `DATABASE_URL` (test-only placeholder, nothing
  listening): PASS — 503 `{"database":"unreachable"}`; driver error logged server-side only
- `npm run db:migrate` without credentials: PASS — exits 1 with a clear message (no fake success)
- **Migration SQL was NOT executed** — no local Postgres and no Supabase credentials exist in this
  environment. Schema is review-ready; live application is a documented manual step
  (see `docs/DATABASE.md` §setup). This is LOCAL SCHEMA VALIDATION, not live verification.

## Phase 4 verification (2026-09-08)

- `npm install` (adds `argon2`, `express-rate-limit`, `vitest`, `@vitest/*`): PASS
- `npm run lint`: PASS (both workspaces)
- `npm run typecheck`: PASS (both workspaces, strict)
- `npm run build`: PASS — frontend JS 286 kB (88 kB gzip), CSS 40 kB (8.3 kB gzip); backend compiles `src/auth/*`, `src/middleware/rateLimit.ts`, `src/routes/{auth,admin}.routes.ts`
- `npm run test` (backend vitest): **16/16 PASS** — login (valid/invalid password/email/inactive/malformed), session (valid/expired/missing/invalid), logout (invalidates session), authorization (401/200/403), security (password hash never returned, safe generic errors)
- `/api/health`: PASS (200, process health — unchanged)
- `/api/health/db` without `DATABASE_URL`: PASS (503 `not_configured` — unchanged)
- **Live Supabase NOT verified** — no credentials in this environment. Auth code is unit-tested against an in-memory mock of the DB layer; live DB round-trips are a documented manual step (see `docs/DATABASE.md` §setup). This is LOCAL UNIT TESTING, not live verification.

## Manual UI checks (Phase 1)

- Layout at mobile / tablet / desktop widths, no horizontal overflow, working navigation,
  visible keyboard focus states, no console errors.
- Note: automated browser testing is not part of Phase 1; a human browser session should confirm
  the visual checks above.

## Future test strategy (per Master Guide §51)

| Area | Coverage to add with its feature phase |
| --- | --- |
| Products | Create, edit, archive, activate, deactivate |
| Cart | Add, remove, pricing, discounts, coupon, persistence |
| Payments | Success, failure, cancellation; duplicate webhook; invalid webhook/payment signatures |
| Delivery | Correct product access; unauthorized/wrong-product access blocked; invalid entitlement handled |
| Admin | Login, logout, unauthorized access, session expiry, permission checks |
