import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { authRouter } from "./auth.routes.js";
import { adminRouter } from "./admin.routes.js";
import { catalogRouter } from "./catalog.routes.js";
import { checkoutRouter } from "./checkout.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);

/*
 * Phase 4 — Admin authentication (Master Guide §37).
 *   /api/auth/*  — login, logout, session (public; login is rate-limited)
 *   /api/admin/* — protected admin routes (require valid admin session)
 */
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);

/*
 * Phase 6 — Public storefront catalog (Master Guide catalog).
 *   GET /api/products, /api/products/:slug, /api/categories
 *   No auth; active-only; customer-safe DTOs (no drive_folder_id).
 */
apiRouter.use("/", catalogRouter);

/*
 * Phase 7 — Cart & checkout foundation (Master Guide §54 success metric:
 * browse → cart → checkout → order). No payment here (Phase 8 = Razorpay).
 *   POST /api/checkout/validate — revalidate a cart against active products
 *   POST /api/checkout/prepare  — create a PENDING, payment-ready order
 */
apiRouter.use("/checkout", checkoutRouter);
