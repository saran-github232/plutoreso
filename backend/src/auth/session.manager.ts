import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { query, getPool, DatabaseNotConfiguredError } from "../db/client.js";

/**
 * Opaque, server-side session manager (Phase 4 / Master Guide §37).
 *
 * Design (docs/AUTHENTICATION.md §session-management):
 * - The session token is a 32-byte cryptographically-random value, encoded
 *   as URL-safe base64 (43 chars, 256 bits of entropy).
 * - ONLY a SHA-256 hash of the token is stored in `sessions.token_hash`.
 *   The raw token is never persisted and never logged.
 * - Sessions are bound to a single admin_id and carry a fixed expiry.
 * - Login rotates/revokes any prior active session for the same admin.
 * - Logout revokes the session row (explicit invalidation).
 * - `verifySession` rejects missing / revoked / expired / inactive / locked
 *   sessions and slides `last_used_at`.
 * - All comparisons use `timingSafeEqual` to prevent timing attacks.
 */

const TOKEN_BYTES = 32; // 256-bit tokens
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionPrincipal {
  adminId: string;
  email: string;
  role: string;
}

interface SessionRecord {
  id: string;
  admin_id: string;
  token_hash: Buffer;
  expires_at: Date;
  revoked_at: Date | null;
  admin_email: string;
  admin_role: string;
  admin_status: string;
  admin_locked_until: Date | null;
}

/** Generate a cryptographically-secure opaque session token (URL-safe base64). */
export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** SHA-256 hash a session token for storage + lookup (matches BYTEA column). */
export function hashSessionToken(token: string): Buffer {
  return createHash("sha256").update(token).digest();
}

/** Constant-time comparison of two token hashes. */
export function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    timingSafeEqual(a, a); // normalize before compare
    return false;
  }
  return timingSafeEqual(a, b);
}

/** Public session lifetime in milliseconds (for cookie max-age). */
export { SESSION_TTL_MS };

/**
 * Persist a new session and return its token + cookie max-age.
 * Revokes any previously-active session for the same admin first (rotation).
 * Uses a transaction via the raw pool; the `query` helper does not support
 * multi-statement transactions.
 */
export async function createSession(params: {
  adminId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{ sessionId: string; token: string; maxAgeMs: number }> {
  const pool = getPool();
  if (!pool) {
    throw new DatabaseNotConfiguredError();
  }

  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await client.query(
      "UPDATE sessions SET revoked_at = $1 WHERE admin_id = $2 AND revoked_at IS NULL;",
      [now, params.adminId]
    );
    const result = await client.query<{ id: string }>(
      `INSERT INTO sessions
         (admin_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id;`,
      [
        params.adminId,
        tokenHash,
        params.ipAddress ?? null,
        params.userAgent ?? null,
        expiresAt,
      ]
    );
    await client.query("COMMIT;");
    const sessionId = result.rows[0]?.id ?? "";
    return { sessionId, token, maxAgeMs: SESSION_TTL_MS };
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Validate a presented token. Returns the authenticated principal only when
 * the session is valid, non-revoked, non-expired, and bound to an active,
 * unlocked admin. Any failure returns `null` (caller emits a generic 401).
 */
export async function verifySession(
  token: string
): Promise<SessionPrincipal | null> {
  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const now = new Date();

  const rows = await query<SessionRecord>(
    `SELECT
       s.id,
       s.admin_id,
       s.token_hash,
       s.expires_at,
       s.revoked_at,
       a.email           AS admin_email,
       a.role            AS admin_role,
       a.status          AS admin_status,
       a.locked_until    AS admin_locked_until
     FROM sessions s
     JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = $1
     LIMIT 1;`,
    [tokenHash]
  );

  const session = rows[0];
  if (!session) {
    return null;
  }

  // Constant-time token comparison to prevent token-oracle attacks.
  if (!safeEqual(session.token_hash, tokenHash)) {
    return null;
  }

  if (
    session.revoked_at ||
    session.expires_at <= now ||
    session.admin_status !== "active"
  ) {
    return null;
  }

  if (session.admin_locked_until) {
    if (new Date(session.admin_locked_until).getTime() > now.getTime()) {
      return null;
    }
  }

  // Slide the session window.
  void query(`UPDATE sessions SET last_used_at = now() WHERE id = $1;`, [
    session.id,
  ]);

  return {
    adminId: session.admin_id,
    email: session.admin_email,
    role: session.admin_role,
  };
}

/** Mark a session row as revoked (logout). Returns true if a row was updated. */
export async function revokeSession(token: string): Promise<boolean> {
  if (!token) {
    return false;
  }
  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const rows = await query<{ id: string }>(
    `UPDATE sessions
        SET revoked_at = $1
      WHERE token_hash = $2 AND revoked_at IS NULL
      RETURNING id;`,
    [now, tokenHash]
  );
  return rows.length > 0;
}
