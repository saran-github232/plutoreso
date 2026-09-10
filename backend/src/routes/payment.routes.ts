import { Router } from "express";
import { createRazorpayOrderHandler } from "../controllers/public/payment.controller.js";

/**
 * Payment routes (Phase 8 — Razorpay integration).
 *
 * Public, no-auth endpoints:
 *   POST /api/payments/razorpay/order — create a Razorpay order for an
 *   existing local PENDING order. The server derives the amount from the
 *   authoritative local order — the browser sends only the order ID.
 *
 * Phase 9 will add:
 *   POST /api/payments/verify — server-side payment verification
 *   POST /api/webhooks/razorpay — Razorpay webhook handler
 */
export const paymentRouter = Router();

paymentRouter.post("/razorpay/order", createRazorpayOrderHandler);
