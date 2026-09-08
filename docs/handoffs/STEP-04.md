# STEP-04: Admin Authentication

## 1. Starting State

- **Phase 1** (`0d72da7`): Project foundation — monorepo, Express 5 app factory, Vite + React 19 frontend, ESLint, TS strict, `/api/health`.
- **Phase 2** (`d22b2cf`): Frontend architecture & premium design system — tokens, UI primitives, routing, shell, homepage foundation.
- **Phase 3** (`ae4feee`): Database & backend foundation — Supabase PostgreSQL schema (17 tables), 7 migrations, `pg` data-access layer, typed models, `/api/health/db` readiness, RLS lockdown.
- Repository at commit `ae4feee` (HEAD = origin/main), working tree clean.

## 2. Phase Objective

Implement a secure, production-oriented **admin authentication foundation** on top of the Phase 3 `admins` table and server-side DB layer. Establish admin login, secure server-side sessions, logout, protected admin API routes, backend authorization, role enforcement, inactive-admin rejection, frontend admin route protection, secure cookies, authentication rate limiting, admin bootstrap, audit logging, tests, and documentation.

## 3. Implemented

### Backend
- **Password hashing** (`src/auth/password.ts`) — Argon2id (memory-hard, OWASP-recommended) for hashing and verification; strength validation.
- **Session management** (`src/auth/session.manager.ts`) — opaque random session tokens, only SHA-256 hash stored in DB, HttpOnly cookie, expiration, revocation, admin association.
- **Admin repository** (`src/auth/admin.repository.ts`) — typed data-access for admin lookup, login metadata, lockout tracking.
- **Auth controller** (`src/auth/auth.controller.ts`) — login handler with Zod input validation, credential verification, lockout enforcement, session creation.
- **Auth handlers** (`src/auth/auth.handlers.ts`) — logout (session revocation + cookie clearing), session check, `/api/admin/me` handler.
- **Auth middleware** (`src/auth/auth.middleware.ts`) — `requireAdmin` middleware enforcing valid active session server-side.
- **Cookie config** (`src/auth/auth.cookies.ts`) — HttpOnly, Secure in production, SameSite=Lax, explicit max-age.
- **Audit logging** (`src/auth/audit.ts`) — records login success/failure, logout, bootstrap events to `audit_logs` table.
- **Rate limiting** (`src/middleware/rateLimit.ts`) — brute-force protection on login endpoint (configurable max attempts + lockout).
- **Auth routes** (`src/routes/auth.routes.ts`) — `POST /api/auth/login` (rate-limited), `POST /api/auth/logout`, `GET /api/auth/session`.
- **Admin routes** (`src/routes/admin.routes.ts`) — `GET /api/admin/me` (protected by `requireAdmin`).
- **Bootstrap script** (`scripts/bootstrap-admin.mjs`) — server-side CLI to create the first admin using `BOOTSTRAP_TOKEN` env var; hashes password before storage; refuses unsafe duplicate creation.
- **Sessions migration** (`supabase/migrations/20260908000008_admin_sessions.sql`) — `admins_sessions` table with token hash, expiration, revocation.
- **Env config** (`src/config/env.ts`) — `SESSION_SECRET`, `BOOTSTRAP_TOKEN`, `LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCKOUT_MINUTES` added with Zod validation; `SESSION_SECRET` required in production.
- **Tests** (`tests/auth.test.ts`) — 16 vitest tests covering login, session, logout, authorization, security.

### Frontend
- **Auth context** (`src/context/AuthContext.tsx`, `useAuth.ts`, `authTypes.ts`) — React context for auth state, `login()`, `logout()`, `checkSession()` methods.
- **Admin login page** (`src/pages/AdminLoginPage.tsx`) — responsive, accessible, email + password fields, loading/error states, uses design system components.
- **Admin dashboard shell** (`src/pages/AdminDashboardPage.tsx`) — minimal protected page proving authenticated access; indicates full admin panel is Phase 5.
- **Admin route guard** (`src/components/admin/AdminRouteGuard.tsx`) — redirects unauthenticated users to `/admin/login` (UX layer only).
- **Route integration** (`src/App.tsx`) — `/admin/login` and `/admin` routes added; all Phase 2 routes preserved.

## 4. Database Architecture

- **Supabase PostgreSQL** as single source of truth.
- **Server-side sessions**: `admins_sessions` table stores only SHA-256 hash of opaque token; raw token never persisted.
- **Password storage**: Argon2id hash in `admins.password_hash`.
- **Money**: unchanged (minor-unit bigint from Phase 3).
- **RLS**: sessions table has RLS enabled (default-deny, no per-role policies yet — deferred to phases with real clients).
- **Migrations**: ordered, idempotent SQL files in `backend/supabase/migrations/`.
