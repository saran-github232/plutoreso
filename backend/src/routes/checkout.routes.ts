import { Router } from "express";
import {
  prepareCheckoutHandler,
  validateCheckoutHandler,
} from "../controllers/public/checkout.controller.js";

/**
 * Checkout routes (Phase 7 — cart/checkout foundation).
 *
 * Public, no-auth endpoints:
 *   POST /api/checkout/validate — revalidate a cart against active products
 *   POST /api/checkout/prepare  — create a PENDING, payment-ready order
 *
 * No payment provider is involved here. The order created here is `PENDING`
 * only — Phase 8 (Razorpay) completes payment and transitions the status.
 */
export const checkoutRouter = Router();

checkoutRouter.post("/validate", validateCheckoutHandler);
checkoutRouter.post("/prepare", prepareCheckoutHandler);
