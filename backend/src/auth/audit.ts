import { query } from "../db/client.js";

/**
 * Audit logging helpers (Phase 3 `audit_logs` table — Master Guide §23).
 *
 * Records security-relevant admin-auth events without exposing secrets.
 * Never logs passwords, hashes, tokens, or sensitive PII beyond what the
 * schema structurally requires (actor + action + entity + metadata).
 */

export type AuditAction =
  | "admin_login_success"
  | "admin_login_failed"
  | "admin_login_rejected_inactive"
  | "admin_logout"
  | "admin_lockout"
  | "admin_bootstrap"
  | "admin_password_set";

export interface AuditContext {
  actorId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Write an audit row. Failures are logged to stderr but never thrown — audit
 * logging must never break the auth flow.
 */
export async function writeAuditLog(ctx: AuditContext): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs
         (actor_id, action, entity_type, entity_id,
          ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb);`,
      [
        ctx.actorId ?? null,
        ctx.action,
        ctx.entityType ?? null,
        ctx.entityId ?? null,
        ctx.ip ?? null,
        ctx.userAgent ?? null,
        ctx.metadata ? JSON.stringify(ctx.metadata) : null,
      ]
    );
  } catch (err) {
    // Audit failures are diagnostic only; never surface to the client.
    console.error(
      "[audit] failed to write audit log:",
      err instanceof Error ? err.message : err
    );
  }
}
