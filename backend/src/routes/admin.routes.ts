import { Router } from "express";
import { adminMe } from "../auth/auth.handlers.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import { adminProductsRouter } from "./admin.products.routes.js";

/**
 * Protected admin routes (Phase 4–5 / Master Guide §17–§19).
 *
 * All routes require a valid, active admin session (enforced server-side by
 * `requireAdmin`). Frontend route guards are UX only — never trusted as
 * security.
 *
 *   GET  /api/admin/me          — protected admin identity endpoint
 *   /api/admin/products/*       — product CRUD + lifecycle (Phase 5)
 *   /api/admin/products/:id/media/* — product media (Phase 5)
 *   /api/admin/categories/*     — category CRUD (Phase 5)
 */
export const adminRouter = Router();

adminRouter.get("/me", requireAdmin, adminMe);

// Mount product/category/media sub-routers (Phase 5).
adminRouter.use("/", adminProductsRouter);

