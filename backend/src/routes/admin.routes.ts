import { Router } from "express";
import { adminMe } from "../auth/auth.handlers.js";
import { requireAdmin } from "../auth/auth.middleware.js";

/**
 * Protected admin routes (Phase 4 / Master Guide §37).
 *
 * All routes require a valid, active admin session (enforced server-side by
 * `requireAdmin`). Frontend route guards are UX only — never trusted as
 * security.
 *
 *   GET /api/admin/me — protected admin identity endpoint
 */
export const adminRouter = Router();

adminRouter.get("/me", requireAdmin, adminMe);
