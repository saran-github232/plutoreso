import { Router } from "express";
import { healthRouter } from "./health.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);

/*
 * Future phase mounts (do NOT implement before their phase):
 *
 *   Phase 3+  /products          – public storefront product API
 *   Phase 4   /auth              – admin authentication (server-side sessions)
 *   Phase 5+  /admin/*           – protected admin API (backend authorization mandatory)
 *   Phase 7+  /orders, /payments – checkout + Razorpay order creation/verification
 *   Phase 9   /webhooks/razorpay – signature-verified, idempotent webhook endpoint
 *   Phase 10+ /entitlements      – access-controlled digital delivery layer
 */
