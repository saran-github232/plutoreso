import type { Request, Response } from "express";
import { revokeSession } from "./session.manager.js";
import { writeAuditLog } from "./audit.js";
import {
  clearSessionCookie,
  extractSessionToken,
  resolvePrincipal,
} from "./auth.cookies.js";
import type { AdminIdentity } from "./auth.cookies.js";
import { type SessionPrincipal } from "./session.manager.js";

/** POST /api/auth/logout — revoke session and clear the cookie. */
export async function logout(req: Request, res: Response): Promise<void> {
  const token = extractSessionToken(req);
  const principal = await resolvePrincipal(req);

  if (token) {
    await revokeSession(token);
  }

  void writeAuditLog({
    actorId: principal?.adminId,
    action: "admin_logout",
    entityType: principal ? "admins" : undefined,
    entityId: principal?.adminId,
    ip: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
  });

  clearSessionCookie(res);
  res.json({ authenticated: false });
}

/** GET /api/auth/session — safe admin identity, or 401. */
export async function session(req: Request, res: Response): Promise<void> {
  const principal = await resolvePrincipal(req);
  if (!principal) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    admin: {
      id: principal.adminId,
      email: principal.email,
      role: principal.role,
    } as AdminIdentity,
  });
}

/**
 * GET /api/admin/me — protected admin identity endpoint.
 * Middleware attaches `req.admin`; this handler never returns password_hash.
 */
export async function adminMe(req: Request, res: Response): Promise<void> {
  const principal = (req as unknown as { admin?: SessionPrincipal }).admin;
  if (!principal) {
    res.status(401).json({ error: { message: "Authentication required." } });
    return;
  }
  res.json({
    authenticated: true,
    admin: {
      id: principal.adminId,
      email: principal.email,
      role: principal.role,
    } as AdminIdentity,
  });
}
