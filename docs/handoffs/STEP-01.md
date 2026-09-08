# STEP-01: Project Foundation

**Phase:** 1 of ~19 · **Date:** 2026-09-08 · **Agent:** 01 (Project Foundation Engineer)
**Source of truth:** `docs/MASTER-GUIDE.md` (read in full before this phase)

## 1. Starting State

- Repository contained exactly one file: `docs/MASTER-GUIDE.md` (25.6 KB).
- No `frontend/`, no `backend/`, no `package.json`, no `.gitignore`, no `README.md`.
- Git: not a repository (no `.git`); git 2.55 available with configured identity.
- Node.js/npm: **not installed** on the machine (no system Node, no nvm/fnm/volta/scoop).
- No working functionality existed; nothing to preserve except the Master Guide itself.

## 2. Phase Objective

Establish a clean, stable, production-oriented foundation per Master Guide §33/§50: monorepo
structure, frontend + backend scaffolding, tooling, environment boundaries, security-conscious
defaults, documentation, and verified build/run — with **no** Phase 2+ features.

## 3. Implemented

- npm-workspaces monorepo (`frontend/`, `backend/`) with root orchestration scripts.
- Backend: Express 5 app factory (`createApp`) — helmet, CORS allowlist, 100 kb body limit,
  request logger (query strings omitted), 404 handler, central error handler (generic client
  messages, server-side-only details), graceful shutdown (SIGTERM/SIGINT), zod-validated env
  config with fail-fast startup, `GET /api/health`, future route mounts documented.
- Frontend: Vite 6 + React 19 + strict TS + Tailwind 4; mobile-first accessible shell
  (Header / HomePage / Footer / SystemStatus health card); typed public API client; skip link,
  landmarks, focus-visible styles, reduced-motion support.
- Tooling: ESLint 9 (flat config, both workspaces), strict TypeScript configs, builds.
- Environment boundaries: `.env.example` (placeholder names only) for both apps; `.gitignore`
  excludes `.env*`, `node_modules/`, `dist/`, `.tools/`.
- Documentation: `README.md`, `PROJECT_STATUS.md`, `docs/{ARCHITECTURE,SECURITY,ENVIRONMENT,TESTING,DEPLOYMENT}.md`, this handoff.
- Machine setup: portable Node.js v22.20.0 runtime at `.tools/` (gitignored, documented) because
  no Node existed on this machine; git repository initialized with an initial commit.

## 4. Files Created

Root: `.gitignore`, `package.json`, `README.md`, `PROJECT_STATUS.md`
Docs: `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/ENVIRONMENT.md`, `docs/TESTING.md`,
`docs/DEPLOYMENT.md`, `docs/handoffs/STEP-01.md`
Backend: `backend/package.json`, `backend/tsconfig.json`, `backend/eslint.config.js`,
`backend/.env.example`, `backend/src/index.ts`, `backend/src/app.ts`,
`backend/src/config/env.ts`, `backend/src/middleware/errorHandler.ts`,
`backend/src/middleware/requestLogger.ts`, `backend/src/routes/index.ts`,
`backend/src/routes/health.routes.ts`
Frontend: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`,
`frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`, `frontend/eslint.config.js`,
`frontend/.env.example`, `frontend/index.html`, `frontend/public/favicon.svg`,
`frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/index.css`,
`frontend/src/vite-env.d.ts`, `frontend/src/lib/api.ts`, `frontend/src/components/Header.tsx`,
`frontend/src/components/Footer.tsx`, `frontend/src/components/SystemStatus.tsx`,
`frontend/src/pages/HomePage.tsx`

## 5. Files Modified

- None. `docs/MASTER-GUIDE.md` was preserved untouched; no pre-existing files were changed
  (the repository was greenfield).

## 6. Files Deleted

None.

## 7. Dependencies Added

Root (dev): `concurrently@^9.1.2` — single-command `npm run dev` for API + web.
Backend (prod): `express@^5.1.0` (HTTP API — Master Guide baseline), `cors@^2.8.5` (origin
allowlist), `helmet@^8.0.0` (security headers), `dotenv@^16.4.5` (env loading),
`zod@^3.25.76` (validated config now; request validation later).
Backend (dev): `typescript@~5.8.3`, `tsx@^4.19.2` (dev watch runner), `eslint@^9`,
`@eslint/js@^9`, `typescript-eslint@^8`, `@types/express@^5`, `@types/cors@^2.8`, `@types/node@^22`.
Frontend (prod): `react@^19.1.0`, `react-dom@^19.1.0`.
Frontend (dev): `vite@^6.3.5`, `@vitejs/plugin-react@^4.4.1`, `tailwindcss@^4.1.4`,
`@tailwindcss/vite@^4.1.4`, `typescript@~5.8.3`, `eslint@^9`, `@eslint/js@^9`,
`typescript-eslint@^8`, `eslint-plugin-react-hooks@^5.2.0`, `eslint-plugin-react-refresh@^0.4.19`,
`globals@^16.2.0`, `@types/react@^19`, `@types/react-dom@^19`.

## 8. Architecture

Monorepo with strict frontend/backend separation (see `docs/ARCHITECTURE.md`):
Browser → Vite (:5173, later Vercel) → JSON/HTTPS → Express (:4000, later Render) →
(Supabase / Razorpay / Google Drive in later phases — not connected).
Backend pipeline: helmet → CORS allowlist → body parsing (100 kb) → request logger → routes →
404 → central error handler. Configuration is zod-validated at startup and fails fast;
`CLIENT_ORIGIN` is mandatory in production. The frontend holds only public config (`VITE_API_URL`);
all secrets will be backend-only. Storage/delivery/payments intentionally absent — they integrate
behind defined boundaries in their own phases.

## 9. Environment Variables

Configured as **example-only** (no real values anywhere):
- Backend (`backend/.env.example`): `NODE_ENV` (default `development`), `PORT` (default `4000`),
  `CLIENT_ORIGIN` (CORS allowlist; **required in production**).
- Frontend (`frontend/.env.example`): `VITE_API_URL` (public backend base URL only).
Future placeholder names documented but not created: `DATABASE_URL`, `SESSION_SECRET`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `GOOGLE_DRIVE_*`, `EMAIL_*`.
No real secrets exist in the repository.

## 10. Tests and Verification

All commands executed from repo root on 2026-09-08 (Node v22.20.0 / npm 10.9.3):

- `node -v` / `npm -v`: v22.20.0 / 10.9.3 (portable runtime) — PASS
- `npm install`: added 292 packages — PASS
- `npm run lint`: backend + frontend ESLint clean, exit 0 — PASS
- `npm run typecheck`: first run **FAIL** (`TS6133` unused `req` param in
  `backend/src/middleware/errorHandler.ts`) → fixed (`_req`) → re-run PASS (both workspaces)
- `npm run build`: backend `tsc` → `backend/dist/index.js`; frontend `tsc -b && vite build`
  (34 modules; `dist/index.html` 0.71 kB, CSS 12.61 kB, JS 199.45 kB / 62.58 kB gzip) — PASS
- Backend runtime: `node dist/index.js` → `GET /api/health` → HTTP 200
  `{"status":"ok","service":"plutoreso-backend","environment":"development","uptimeSeconds":2,...}` — PASS
- `GET /api/nonexistent` → HTTP 404 JSON — PASS
- `POST` malformed JSON → HTTP 400 JSON (no crash, no stack trace) — PASS
- Built frontend via `vite preview` → `GET /` → HTTP 200, contains `#root` and PlutoReso markup — PASS
- Initial git commit created (local repository; GitHub remote not yet set up by owner).

## 11. Known Issues

- Node.js is not installed system-wide on this machine; the gitignored portable runtime at
  `.tools/` is used (documented in README). Commands must include it on `PATH` here.
- First backend cold start exceeded a 2-second readiness wait in one probe (resolved by retry);
  subsequent starts were immediate. Not reproducible as a defect.
- No automated test framework yet — intentional Phase 1 scope (see `docs/TESTING.md`).
- Browser responsive/accessibility verification relies on build + preview + code review; a human
  browser pass is recommended.

## 12. Blockers

- None for Phase 2.
- GitHub remote: owner must create/connect it when ready (local git initialized and committed).

## 13. Current Project State

Working right now: `npm install`, `npm run dev` (API :4000 + web :5173), `npm run lint`,
`npm run typecheck`, `npm run build`, `npm run start`; backend serves `/api/health` with correct
404/400 handling; frontend builds and serves a mobile-first accessible shell that reports backend
connectivity. Documentation set and environment boundaries are in place. No products, cart,
payments, admin, auth, delivery, email, or analytics exist — correctly absent per phase scope.

## 14. Next Phase

**Phase 2 — Frontend Architecture & Design System** (per Master Guide §50): establish the premium
design system (brand tokens, typography pairing, component primitives, layout/navigation patterns)
on top of this shell. Do not begin until the owner provides the Phase 2 prompt.

