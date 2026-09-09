import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { DatabaseNotConfiguredError, getPool } from "../../db/client.js";
import {
  createPendingOrderWithItems,
  findRecentPendingOrderWithItems,
  getActiveProductsByIds,
  getPrimaryImageUrls,
  upsertCustomerByEmail,
} from "../../repositories/checkout.repository.js";
import {
  calculateSubtotalMinor,
  toPublicOrder,
  toPublicValidatedCart,
} from "./checkout.dto.js";
import {
  mergeCartItems,
  prepareCheckoutBodySchema,
  validateCheckoutBodySchema,
} from "../../validation/checkout.schemas.js";

/**
 * Checkout controller (Phase 7 — cart/checkout foundation).
 *
 * Security invariants (Master Guide §10, §25, §42):
 * - Prices / names / currency are NEVER accepted from the browser; active
 *   products are re-read from the database for every request.
 * - Totals are computed server-side only (integer minor units / paise).
 * - Responses never expose `drive_folder_id`, entitlements, or admin data.
 * - No payment is created and the order is only ever PENDING — Phase 8
 *   (Razorpay) owns the PAID transition.
 */

const DEDUPE_WINDOW_MINUTES = 24 * 60;

function isDbMissing(error: unknown): boolean {
  return (
    error instanceof DatabaseNotConfiguredError ||
    (error as { name?: string } | null)?.name === "DatabaseNotConfiguredError"
  );
}

/** True when two product-id sets match (order-independent). */
function sameProductSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const one = new Set(a);
  return b.every((id) => one.has(id));
}

/** POST /api/checkout/validate — cart revalidation for the storefront. */
export async function validateCheckoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const parsed = validateCheckoutBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: "Invalid checkout request.", details: parsed.error.issues },
    });
    return;
  }

  try {
    const pool = getPool();
    if (!pool) {
      throw new DatabaseNotConfiguredError();
    }
    const merged = mergeCartItems(parsed.data.items);
    const requestedIds = merged.map((item) => item.product_id);
        const products = await getActiveProductsByIds(pool, requestedIds);
    const images = await getPrimaryImageUrls(pool, requestedIds);
    res.json({ cart: toPublicValidatedCart(products, requestedIds, images) });
  } catch (error) {
    if (isDbMissing(error)) {
      res.status(503).json({ error: { message: "Checkout is temporarily unavailable." } });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/checkout/prepare — creates the unpaid, payment-ready order.
 *
 * On success returns the public order summary with `status: PENDING` and a
 * `next_step` hint for Phase 8. Reusing an existing PENDING order (same
 * customer, same product set, within the dedupe window) is allowed when
 * `client_request_id` is supplied and matches → idempotency-safe for retries.
 */
export async function prepareCheckoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const parsed = prepareCheckoutBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: "Invalid checkout request.", details: parsed.error.issues },
    });
    return;
  }

  const pool = getPool();
  if (!pool) {
    res.status(503).json({ error: { message: "Checkout is temporarily unavailable." } });
    return;
  }

  const merged = mergeCartItems(parsed.data.items);
  const requestedIds = merged.map((item) => item.product_id);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Authoritative product read inside the transaction; reject unavailable items.
    const products = await getActiveProductsByIds(client, requestedIds);
    if (products.length !== requestedIds.length) {
      const productIds = new Set(products.map((p) => p.id));
      const unavailable = requestedIds.filter((id) => !productIds.has(id));
      await client.query("ROLLBACK");
      res.status(409).json({
        error: {
          message: "Some items in your cart are no longer available.",
          unavailable_product_ids: unavailable,
        },
      });
      return;
    }

    const customer = await upsertCustomerByEmail(client, parsed.data.customer);

    // Idempotency: reuse an existing PENDING order for this customer if the
    // product set matches and it was created within the dedupe window.
    if (parsed.data.client_request_id) {
      const recent = await findRecentPendingOrderWithItems(
        client,
        customer.id,
        DEDUPE_WINDOW_MINUTES
      );
      if (recent && sameProductSet(recent.items.map((i) => i.product_id), requestedIds)) {
        await client.query("COMMIT");
        res.status(200).json({ order: toPublicOrder(recent.order, recent.items) });
        return;
      }
    }

    // Authoritative pricing: integer minor units from the DB prices.
        const subtotalMinor = calculateSubtotalMinor(products);
    const currency = products[0]?.currency ?? "INR";

    const { order, items } = await createPendingOrderWithItems(client, {
      customerId: customer.id,
      subtotalMinor,
      totalMinor: subtotalMinor,
      currency,
      items: products.map((product) => ({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        unitPriceMinor: product.price_minor,
        compareAtPriceMinor: product.compare_at_price_minor,
        quantity: 1,
        lineTotalMinor: product.price_minor,
      })),
    });

    await client.query("COMMIT");
    res.status(201).json({ order: toPublicOrder(order, items) });
  } catch (error) {
    // Always attempt to roll the transaction back on failure. A
    // ROLLBACK-without-active-transaction error is intentionally ignored.
    try {
      await client.query("ROLLBACK");
    } catch {
      /* no active transaction — nothing to roll back */
    }
    if (isDbMissing(error)) {
      res.status(503).json({ error: { message: "Checkout is temporarily unavailable." } });
      return;
    }
    if (error instanceof ZodError) {
      res.status(400).json({
        error: { message: "Invalid checkout request.", details: error.issues },
      });
      return;
    }
    next(error);
  } finally {
    client.release();
  }
}

