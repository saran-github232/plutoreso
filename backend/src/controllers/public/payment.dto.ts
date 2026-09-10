import type { PaymentRow } from "../../db/types.js";

/**
 * Public payment DTOs (Phase 8 — Razorpay integration).
 *
 * Raw database rows are never returned. These projections carry only
 * customer-safe payment facts — no provider secrets, no raw metadata.
 * All amounts are integer minor units (paise for INR).
 */

export interface PublicPayment {
  id: string;
  status: string;
  amount_minor: number;
  currency: string;
  provider_order_id: string;
  created_at: string;
}

export interface RazorpayOrderResponse {
  /** Razorpay order ID to pass to the Checkout. */
  razorpay_order_id: string;
  /** Amount in integer minor units (paise). */
  amount_minor: number;
  /** ISO 4217 currency code. */
  currency: string;
  /** Razorpay Key ID (safe to expose to browser). */
  key_id: string;
  /** Local PlutoReso order reference. */
  order_number: string;
  /** Local order status (PAYMENT_INITIATED). */
  order_status: string;
  /** Human-readable business name for the Checkout. */
  business_name: string;
  /** Optional description for the Checkout. */
  description: string;
}

/**
 * Projects a payment row onto the public DTO.
 */
export function toPublicPayment(payment: PaymentRow): PublicPayment {
  return {
    id: payment.id,
    status: payment.status,
    amount_minor: payment.amount_minor,
    currency: payment.currency,
    provider_order_id: payment.provider_order_id ?? "",
    created_at: new Date(payment.created_at).toISOString(),
  };
}
