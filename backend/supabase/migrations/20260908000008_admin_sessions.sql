-- =====================================================================
-- STEP 08: Admin authentication support
--
-- Phase 4 deliverable (Master Guide §37, step 1 of 2):
--   Adds the server-side `sessions` table and extends the Phase 3 `admins`
--   table with the columns needed for authentication/authorization without
--   changing existing behavior or column meaning.
--
-- This migration is additive and backward-compatible:
--   - `admins.password_hash` becomes NOT NULL (was already the intended
--     shape; admins created before Phase 4 bootstrap are expected to set a
--     password before login is possible).
--   - `admins.failed_login_attempts`, `admins.locked_until`, and
--     `admins.last_login_at` are added as nullable columns for the
--     authentication + rate-limiting logic. Existing rows default to NULL.
--   - The new `sessions` table is independent and empty until Phase 4.
--
-- SECURITY MODEL (see docs/DATABASE.md §authentication):
--   - `sessions.token_hash` stores only a SHA-256 hash of the opaque
--     session token. The raw token is never persisted.
--   - Sessions are scoped to a single `admin_id` and expire on a fixed
--     window. Logout deletes the row (explicit revocation).
--   - RLS keeps per-admin row isolation; the privileged backend service
--     role (owner) accesses sessions server-side only.
-- =====================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        UUID      NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token_hash      BYTEA     NOT NULL UNIQUE,           -- sha256(opaque token)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,                          -- logout / explicit revoke
    ip_address      INET,                                -- best-effort session binding
    user_agent      TEXT,                                -- audit context only
    CONSTRAINT sessions_admin_not_null CHECK (admin_id IS NOT NULL)
);

-- One active session per admin is enforced at the application layer by
-- revoking prior sessions on a new login (login rotates/deletes the old
-- session). The token_hash unique index also prevents accidental dupes.
CREATE INDEX IF NOT EXISTS idx_sessions_admin_id      ON sessions (admin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash    ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at    ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked_at    ON sessions (revoked_at);

-- =====================================================================
-- Extend the existing admins table for authentication flows.
-- These additions are non-destructive: nullable columns leave existing
-- rows (from Phase 3) intact until Phase 4 bootstrap/usage populates them.
-- =====================================================================
ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until            TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_login_at           TIMESTAMPTZ;

-- Index the lockout window so login rejection is cheap under attack.
CREATE INDEX IF NOT EXISTS idx_admins_locked_until ON admins (locked_until);
