import { z } from "zod";

/**
 * Checkout validation schemas (Phase 7 — cart/checkout foundation).
 *
 * The browser is NEVER trusted for money. Cart lines carry only product IDs
 * (+ a quantity the server normalizes to 1 per Master Guide §10 digital
 * licensing: each product is a single license per purchase). Prices, names,
 * currency, and totals are re-read authoritatively from PostgreSQL by the
 * checkout controller; nothing in these schemas accepts client-supplied
 * monetary amounts.
 */

const uuidSchema = z
  .string()
  .uuid({ message: "Invalid product id." });

/**
 * Master Guide §10: digital products do not allow duplicate quantities — each
 * product is one license per purchase. `quantity` is accepted for
 * forward-compatibility with the order_items schema but is clamped to 1 here;
 * values greater than 1 are rejected before reaching an order.
 */
const cartLineSchema = z
  .object({
    product_id: uuidSchema,
    quantity: z
      .number()
      .int({ message: "Quantity must be a whole number." })
      .min(1, { message: "Quantity must be at least 1." })
      .max(1, {
        message: "Digital products are limited to one license per purchase.",
      })
      .default(1),
  })
  .strict();

export type CartLineInput = z.infer<typeof cartLineSchema>;

/**
 * A cart is an array of product IDs (duplicate product IDs are tolerated on
 * input and merged server-side; the order constraint is one row per
 * (order, product) — see Master Guide §10). 1..20 lines keeps requests sane.
 */
export const cartLinesSchema = z
  .array(cartLineSchema)
  .min(1, { message: "Your cart is empty." })
  .max(20, { message: "Your cart exceeds the maximum of 20 products." });

/** POST /api/checkout/validate — revalidate a client cart against the DB. */
export const validateCheckoutBodySchema = z
  .object({
    items: cartLinesSchema,
  })
  .strict();

export type ValidateCheckoutBody = z.infer<typeof validateCheckoutBodySchema>;

const customerNameSchema = z
  .string()
  .trim()
  .min(2, { message: "Please enter your full name." })
  .max(100, { message: "Name must be at most 100 characters." });

const customerEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Please enter a valid email address." })
  .max(254, { message: "Email must be at most 254 characters." });

/** Loose-but-sane international phone: digits with optional + - ( ) spaces. */
const customerPhoneSchema = z
  .string()
  .trim()
  .regex(/^[+]?[\d\s\-().]{7,15}$/, {
    message: "Please enter a valid phone number (7–15 digits).",
  });

/**
 * POST /api/checkout/prepare — customer checkout information.
 *
 * Only fields present on the Phase 3 `customers` table are collected (name,
 * email, phone). Email is normalized server-side (trimmed, lowercased); the
 * column is citext with a unique index, so lookups/upserts are safe.
 */
export const prepareCheckoutBodySchema = z
  .object({
    items: cartLinesSchema,
    customer: z
      .object({
        name: customerNameSchema,
        email: customerEmailSchema,
        phone: customerPhoneSchema.optional(),
      })
      .strict(),
    /**
     * Duplicate-submission guard (Phase 7 idempotency foundation): an
     * optional client-generated UUID. When supplied, a PENDING order for the
     * same customer with the same product set created inside the dedupe
     * window is returned instead of creating a second order. No schema change
     * is required — the dedupe window is evaluated in the controller.
     */
    client_request_id: uuidSchema.optional(),
  })
  .strict();

export type PrepareCheckoutBody = z.infer<typeof prepareCheckoutBodySchema>;

/**
 * Normalizes a cart for ordering: one line per product (digital licensing =
 * quantity 1), preserving request order. Duplicate product IDs in the same
 * request collapse to a single line.
 */
export function mergeCartItems(items: CartLineInput[]): CartLineInput[] {
  const seen = new Set<string>();
  const result: CartLineInput[] = [];
  for (const item of items) {
    if (seen.has(item.product_id)) {
      continue;
    }
    seen.add(item.product_id);
    result.push({ product_id: item.product_id, quantity: 1 });
  }
  return result;
}
