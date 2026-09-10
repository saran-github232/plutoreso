import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import type { OrderId } from "../../db/types.js";
import { DatabaseNotConfiguredError, getPool } from "../../db/client.js";
import { env } from "../../config/env.js";
import {
  createPayment,
  findLatestPaymentForOrder,
  getOrderWithItems,
  markOrderPaymentInitiated,
} from "../../repositories/payment.repository.js";
import {
  RazorpayError,
  createRazorpayOrder,
  isRazorpayConfigured,
} from "../../services/razorpay.service.js";
import { createRazorpayOrderBodySchema } from "../../validation/payment.schemas.js";

/**
 * Payment controller (Phase 8 — Razorpay integration).
 *
 * Idempotency model: the FIRST call creates one Razorpay order and records it
 * in `payments` (status `created`), then flips the local order to
 * `PAYMENT_INITIATED`. A RETRY for the same local order (customer closed the
 * modal, reloaded the page, or double-clicked) reuses the recorded Razorpay
 * order and returns 200 — we never create a second Razorpay order for the
 * same local order. Phase 9 owns verification and webhooks; nothing here
 * ever marks an order PAID.
 */
const BUSINESS_NAME = "PlutoReso";
const BUSINESS_DESCRIPTION = "Digital product purchase";

/**
 * A local order is payable when it is PENDING (first payment attempt) or
 * PAYMENT_INITIATED (a retry after the first Razorpay order was created).
 * Any later state (PAID / FAILED / CANCELLED / REFUNDED ...) is rejected.
 */
const PAYABLE_ORDER_STATUSES = ["PENDING", "PAYMENT_INITIATED"] as const;

export function isOrderPayable(status: string): boolean {
  return (PAYABLE_ORDER_STATUSES as readonly string[]).includes(status);
}

function isDbMissing(error: unknown): boolean {
  return (
    error instanceof DatabaseNotConfiguredError ||
    (error as { name?: string } | null)?.name === "DatabaseNotConfiguredError"
  );
}

export async function createRazorpayOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!isRazorpayConfigured()) {
    res.status(503).json({ error: { message: "Payment service is not configured." } });
    return;
  }
  const parsed = createRazorpayOrderBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Invalid payment request.", details: parsed.error.issues } });
    return;
  }
  const pool = getPool();
  if (!pool) {
    res.status(503).json({ error: { message: "Payment service is temporarily unavailable." } });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await getOrderWithItems(client, parsed.data.order_id as OrderId);
    if (!result) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: { message: "Order not found." } });
      return;
    }
    const { order } = result;
    if (!isOrderPayable(order.status)) {
      await client.query("ROLLBACK");
      res.status(409).json({ error: { message: `Order is not available for payment (current state: ${order.status}).` } });
      return;
    }
    if (order.total_minor <= 0) {
      await client.query("ROLLBACK");
      res.status(409).json({ error: { message: "Order amount is invalid." } });
      return;
    }

    const keyId = env.RAZORPAY_KEY_ID;

    // Idempotency: if this local order already has an unpaid (`created`)
    // payment, reuse its Razorpay order — do NOT hit the provider again.
    const existingPayment = await findLatestPaymentForOrder(client, order.id, "created");
    if (existingPayment?.provider_order_id) {
      await client.query("COMMIT");
      res.status(200).json({
        razorpay_order_id: existingPayment.provider_order_id,
        amount_minor: order.total_minor,
        currency: order.currency,
        key_id: keyId ?? "",
        order_number: order.order_number,
        order_status: order.status,
        business_name: BUSINESS_NAME,
        description: BUSINESS_DESCRIPTION,
      });
      return;
    }

    const razorpayOrder = await createRazorpayOrder({
      receipt: order.order_number,
      amountMinor: order.total_minor,
      currency: order.currency,
      notes: { order_id: order.id, order_number: order.order_number },
    });
    await createPayment(client, {
      orderId: order.id,
      provider: "razorpay",
      providerOrderId: razorpayOrder.id,
      amountMinor: order.total_minor,
      currency: order.currency,
    });
    await markOrderPaymentInitiated(client, order.id);
    await client.query("COMMIT");
    res.status(201).json({
      razorpay_order_id: razorpayOrder.id,
      amount_minor: order.total_minor,
      currency: order.currency,
      key_id: keyId ?? "",
      order_number: order.order_number,
      order_status: "PAYMENT_INITIATED",
      business_name: BUSINESS_NAME,
      description: BUSINESS_DESCRIPTION,
    });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { /* no active transaction */ }
    if (isDbMissing(error)) {
      res.status(503).json({ error: { message: "Payment service is temporarily unavailable." } });
      return;
    }
    if (error instanceof RazorpayError) {
      res.status(502).json({ error: { message: error.message } });
      return;
    }
    if (error instanceof ZodError) {
      res.status(400).json({ error: { message: "Invalid payment request.", details: error.issues } });
      return;
    }
    next(error);
  } finally {
    client.release();
  }
}
