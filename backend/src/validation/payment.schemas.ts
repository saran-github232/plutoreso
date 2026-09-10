import { z } from "zod";

/**
 * Payment validation schemas (Phase 8 — Razorpay integration).
 *
 * The browser sends ONLY the local order reference. Amount, currency, and
 * all monetary values are re-read from the authoritative local order in
 * PostgreSQL. The browser is NEVER trusted for money.
 */

/**
 * POST /api/payments/razorpay/order — request to create a Razorpay order
 * for an existing local PENDING order.
 *
 * Only the local order ID is accepted. The server loads the order from DB,
 * validates its state, and derives the authoritative amount.
 */
export const createRazorpayOrderBodySchema = z
  .object({
    /** Local PlutoReso order ID (UUID). */
    order_id: z.string().uuid({ message: "Invalid order id." }),
  })
  .strict();

export type CreateRazorpayOrderBody = z.infer<typeof createRazorpayOrderBodySchema>;
