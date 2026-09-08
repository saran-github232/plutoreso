import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { authRouter } from "./auth.routes.js";
import { adminRouter } from "./admin.routes.js";

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
 * Future phase mounts (do NOT implement before their phase):
 *
 *   Phase 5+  /products          – public storefront product API
 *   Phase 7+  /orders, /payments – checkout + Razorpay order creation/verification
 *   Phase 9   /webhooks/razorpay – signature-verified, idempotent webhook endpoint
 *   Phase 10+ /entitlements      – access-controlled digital delivery layer
 */
