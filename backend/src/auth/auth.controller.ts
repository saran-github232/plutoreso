import type { Request, Response } from "express";
import { z } from "zod";
import {
  findAdminForLogin,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "./admin.repository.js";
import { verifyPassword } from "./password.js";
import { createSession } from "./session.manager.js";
import { writeAuditLog } from "./audit.js";
import { setSessionCookie } from "./auth.cookies.js";
import type { AdminIdentity } from "./auth.cookies.js";

/** Login request validation schema. */
export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address.").max(320),
  password: z.string().min(1, "Password is required.").max(128),
});

/**
 * Auth route handlers (Phase 4 / Master Guide §37).
 *
 * Endpoints:
 *   POST /api/auth/login   — validate credentials, create session
 *   POST /api/auth/logout  — revoke session, clear cookie
 *   GET  /api/auth/session — return authenticated admin (or 401)
 *   GET  /api/admin/me     — protected admin identity endpoint
 *
 * Security:
 *   - Password verification uses Argon2id via `verifyPassword`.
 *   - Generic 401 on every failure so account enumeration by response shape
 *     or timing is not possible; a dummy argon2 compare is run when the admin
 *     does not exist.
 *   - The session token is stored only as a SHA-256 hash in `sessions`;
 *     the raw token lives solely in the HttpOnly cookie.
 */

// Dummy Argon2id hash used only for timing-safe dummy verification when the
// admin does not exist or has no password set. Never a real credential.
const DUMMY_ARGON2ID_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$ZHVtbXk$ZHVtbXk";

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = (req.body ?? {}) as LoginBody;

  const emailStr =
    typeof email === "string" && email.trim().length > 0 ? email.trim() : null;
  const passwordStr =
    typeof password === "string" && password.length > 0 ? password : null;

  if (!emailStr || !passwordStr) {
    res.status(401).json({ error: { message: "Invalid email or password." } });
    return;
  }

  const ipAddress = req.ip ?? null;
  const userAgent = req.get("user-agent") ?? null;

  try {
    const adminRow = await findAdminForLogin(emailStr);

    // Timing-safe verification. If the admin does not exist, run a dummy
    // argon2 compare so the response-time envelope is indistinguishable from
    // "wrong password" (mitigates user enumeration).
    let passwordOk = false;
    if (adminRow && adminRow.password_hash) {
      passwordOk = await verifyPassword(passwordStr, adminRow.password_hash);
    } else {
      passwordOk = await verifyPassword(passwordStr, DUMMY_ARGON2ID_HASH);
    }

    if (!adminRow || !passwordOk || adminRow.status !== "active") {
      void writeAuditLog({
        actorId: adminRow?.id,
        action:
          adminRow && adminRow.status !== "active"
            ? "admin_login_rejected_inactive"
            : "admin_login_failed",
        entityType: "admins",
        entityId: adminRow?.id,
        ip: ipAddress ?? null,
        userAgent: userAgent ?? null,
        metadata: { reason: "invalid_credentials_or_inactive" },
      });

      // Increment the failure counter only for a known admin.
      if (adminRow) {
        void recordFailedLogin(adminRow.id, {
          maxAttempts: 5,
          lockWindowMs: 15 * 60 * 1000,
        });
      }

      res.status(401).json({ error: { message: "Invalid email or password." } });
      return;
    }

    // Account lockout check.
    if (adminRow.locked_until) {
      const lockedUntil = new Date(adminRow.locked_until);
      if (lockedUntil.getTime() > Date.now()) {
        void writeAuditLog({
          actorId: adminRow.id,
          action: "admin_lockout",
          entityType: "admins",
          entityId: adminRow.id,
          ip: ipAddress ?? null,
          userAgent: userAgent ?? null,
          metadata: { lockedUntil: adminRow.locked_until.toISOString() },
        });
        res.status(429).json({
          error: { message: "Too many failed attempts. Please try again later." },
        });
        return;
      }
    }

    // Reset failure counters on a clean login.
    await recordSuccessfulLogin(adminRow.id);

    const { token, maxAgeMs } = await createSession({
      adminId: adminRow.id,
      ipAddress,
      userAgent,
    });

    setSessionCookie(res, token, maxAgeMs);

    void writeAuditLog({
      actorId: adminRow.id,
      action: "admin_login_success",
      entityType: "admins",
      entityId: adminRow.id,
      ip: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });

    res.json({
      authenticated: true,
      admin: {
        id: adminRow.id,
        email: adminRow.email,
        name: adminRow.name,
        role: adminRow.role,
      } as AdminIdentity,
    });
  } catch (err) {
    console.error("[auth.login] error:", err instanceof Error ? err.message : err);
    res
      .status(500)
      .json({ error: { message: "Authentication temporarily unavailable." } });
  }
}
