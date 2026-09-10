import type {
  OrderId,
  OrderItemRow,
  OrderRow,
  PaymentRow,
} from "../db/types.js";
import { query } from "../db/client.js";
import type { Executor } from "./checkout.repository.js";

/**
 * Payment data-access (Phase 8 — Razorpay integration).
 */

export interface NewPaymentInput {
  orderId: OrderId;
  provider: string;
  providerOrderId: string;
  amountMinor: number;
  currency: string;
}

export async function getOrderWithItems(
  executor: Executor,
  orderId: OrderId
): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
  const orderResult = await executor.query<OrderRow>(
    `SELECT * FROM orders WHERE id = $1 LIMIT 1`,
    [orderId]
  );
  const order = orderResult.rows[0];
  if (!order) return null;
  const itemResult = await executor.query<OrderItemRow>(
    `SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC`,
    [orderId]
  );
  return { order, items: itemResult.rows };
}

export async function findPaymentByProviderOrderId(
  executor: Executor,
  providerOrderId: string
): Promise<PaymentRow | null> {
  const result = await executor.query<PaymentRow>(
    `SELECT * FROM payments WHERE provider_order_id = $1 LIMIT 1`,
    [providerOrderId]
  );
  return result.rows[0] ?? null;
}

/**
 * Returns the most recent payment row for an order (optionally filtered by
 * status). Used for idempotency: when a `created` payment already exists for
 * the local order we reuse the same Razorpay order instead of creating
 * another one on retry.
 */
export async function findLatestPaymentForOrder(
  executor: Executor,
  orderId: OrderId,
  status?: "created" | "authorized" | "captured" | "failed" | "refunded" | "partially_refunded"
): Promise<PaymentRow | null> {
  const result = await executor.query<PaymentRow>(
    status
      ? `SELECT * FROM payments WHERE order_id = $1 AND status = $2
         ORDER BY created_at DESC LIMIT 1`
      : `SELECT * FROM payments WHERE order_id = $1
         ORDER BY created_at DESC LIMIT 1`,
    status ? [orderId, status] : [orderId]
  );
  return result.rows[0] ?? null;
}

export async function createPayment(
  executor: Executor,
  input: NewPaymentInput
): Promise<PaymentRow> {
  const result = await executor.query<PaymentRow>(
    `INSERT INTO payments (order_id, provider, provider_order_id, status, amount_minor, currency)
     VALUES ($1, $2, $3, 'created', $4, $5)
     RETURNING *`,
    [input.orderId, input.provider, input.providerOrderId, input.amountMinor, input.currency]
  );
  const payment = result.rows[0];
  if (!payment) throw new Error("Failed to create payment record");
  return payment;
}

export async function markOrderPaymentInitiated(
  executor: Executor,
  orderId: OrderId
): Promise<void> {
  await executor.query(
    `UPDATE orders SET status = 'PAYMENT_INITIATED', updated_at = now() WHERE id = $1`,
    [orderId]
  );
}

export async function listPaymentsForOrder(orderId: OrderId): Promise<PaymentRow[]> {
  return query<PaymentRow>(
    `SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at ASC`,
    [orderId]
  );
}
