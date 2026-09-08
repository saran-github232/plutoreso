import { query } from "../db/client.js";

/**
 * Admin data-access layer (Phase 3 schema + Phase 4 auth fields).
 *
 * All queries are parameterized (Master Guide §25 / §23). The `password_hash`
 * column is only ever fetched internally for login verification — it is never
 * selected for any API response.
 */

export interface AdminRow {
  id: string;
  email: string;
  name: string | null;
  role: string; // 'owner' | 'admin'
  status: string; // 'active' | 'disabled'
}

/** Subset loaded for login verification (includes hash + lock state). */
export interface AdminLoginRow extends AdminRow {
  password_hash: string | null;
  failed_login_attempts: number;
  locked_until: Date | null;
  last_login_at: Date | null;
}

/** Select a sanitized admin row (no password_hash) by id. */
export async function findAdminById(id: string): Promise<AdminRow | null> {
  const rows = await query<AdminRow>(
    `SELECT id, email, name, role, status
       FROM admins
      WHERE id = $1
      LIMIT 1;`,
    [id]
  );
  return rows[0] ?? null;
}

/** Fetch the row needed for login validation (internal auth use only). */
export async function findAdminForLogin(
  email: string
): Promise<AdminLoginRow | null> {
  const rows = await query<AdminLoginRow>(
    `SELECT id, email, name, role, status, password_hash,
            failed_login_attempts, locked_until, last_login_at
       FROM admins
      WHERE email = $1
      LIMIT 1;`,
    [email]
  );
  return rows[0] ?? null;
}

/** Record a successful login: reset counters, stamp last_login_at. */
export async function recordSuccessfulLogin(adminId: string): Promise<void> {
  const now = new Date();
  await query(
    `UPDATE admins
        SET failed_login_attempts = 0,
            locked_until = NULL,
            last_login_at = $1
      WHERE id = $2;`,
    [now, adminId]
  );
}

/** Increment the failure counter and apply lockout when the threshold is hit. */
export async function recordFailedLogin(
  adminId: string,
  opts: { maxAttempts: number; lockWindowMs: number }
): Promise<void> {
  const now = new Date();
  await query(
    `UPDATE admins
        SET failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE
              WHEN failed_login_attempts + 1 >= $1
              THEN CAST($2 AS timestamptz)
              ELSE locked_until
            END
      WHERE id = $3;`,
    [opts.maxAttempts, now.toISOString(), adminId]
  );
}
