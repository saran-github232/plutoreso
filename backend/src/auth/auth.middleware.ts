import type { Request, Response, NextFunction } from "express";
import { resolvePrincipal } from "./auth.cookies.js";
import { type SessionPrincipal } from "./session.manager.js";

/** Known admin roles (mirrors the `admins.role` CHECK constraint). */
export type AdminRole = "owner" | "admin";

/**
 * Authorization middleware (Phase 4 / Master Guide §37).
 *
 * `requireAdmin` — attaches `req.admin` for an authenticated admin; 401 otherwise.
 * `requireRole`  — additionally enforces that the admin's role is permitted.
 *
 * These enforce authorization on the BACKEND. Frontend route guards are UX
 * only and must never be trusted as security.
 */

// Augment Express' Request with the authenticated admin principal (type-safe,
// not `any`).
declare module "express-serve-static-core" {
  interface Request {
    admin?: SessionPrincipal;
  }
}


/**
 * Require an active, authenticated admin session.
 * On success, attaches the safe `SessionPrincipal` to `req.admin`.
 * On failure (no/invalid/expired session, inactive admin), responds 401.
 */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const principal = await resolvePrincipal(req);
  if (!principal) {
    _res.status(401).json({ error: { message: "Authentication required." } });
    return;
  }
  req.admin = principal;
  next();
}

/**
 * Require a specific role (or set of roles). Must be used AFTER `requireAdmin`
 * so `req.admin` is populated. Returns 403 if authenticated but not authorized.
 */
export function requireRole(...allowed: AdminRole[]): (
  req: Request,
  res: Response,
  next: NextFunction
) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const principal = req.admin;
    if (!principal) {
      // Defensive: should not happen if used after requireAdmin.
      res.status(401).json({ error: { message: "Authentication required." } });
      return;
    }
    if (!allowed.includes(principal.role as AdminRole)) {
      res.status(403).json({ error: { message: "Insufficient permissions." } });
      return;
    }
    next();
  };
}
