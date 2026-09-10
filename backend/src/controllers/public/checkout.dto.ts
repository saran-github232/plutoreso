import type { OrderItemRow, OrderRow } from "../../db/types.js";

/**
 * Explicit public checkout/order response DTOs (Phase 7).
 *
 * Raw database rows are never returned. These projections carry only
 * customer-safe order facts — no drive_folder_id, no customer internals
 * beyond what the customer supplied, no payment provider metadata.
 * All amounts are integer minor units (paise for INR).
 */

/** Minimal product projection the checkout DTOs depend on (server-owned). */
export interface CheckoutProductLike {
  id: string;
  name: string;
  slug: string;
  price_minor: number;
  compare_at_price_minor: number | null;
  currency: string;
}

export interface PublicOrderItem {
  product_id: string;
  product_name: string;
  product_slug: string;
  unit_price_minor: number;
  compare_at_price_minor: number | null;
  quantity: number;
  line_total_minor: number;
}

export interface PublicOrder {
  /** Local PlutoReso order UUID — the reference the payment endpoint needs. */
  id: string;
  order_number: string;
  status: string;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  total_minor: number;
  items: PublicOrderItem[];
  created_at: string;
}

/** Projects an order + its item rows onto the public, customer-safe DTO. */
export function toPublicOrder(order: OrderRow, items: OrderItemRow[]): PublicOrder {
  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    currency: order.currency,
    subtotal_minor: order.subtotal_minor,
    discount_minor: order.discount_minor,
    total_minor: order.total_minor,
    items: items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name_snapshot,
      product_slug: item.product_slug_snapshot,
      unit_price_minor: item.unit_price_minor,
      compare_at_price_minor: item.compare_at_price_minor,
      quantity: item.quantity,
      line_total_minor: item.line_total_minor,
    })),
    created_at: new Date(order.created_at).toISOString(),
  };
}

/** Authoritative cart-revalidation line (validate endpoint response). */
export interface PublicValidatedItem {
  product_id: string;
  product_name: string;
  product_slug: string;
  unit_price_minor: number;
  compare_at_price_minor: number | null;
  currency: string;
  image_url: string | null;
}

/**
 * Authoritative, customer-safe cart revalidation result.
 * - `items` only contains products that are currently active/purchasable.
 * - `unavailable_product_ids` lists every ID from the request that could not
 *   be loaded (inactive / archived / unknown) so the cart can drop them.
 * - `subtotal_minor` is computed from DB prices — the browser never supplies
 *   an authoritative total; stale detection happens on the frontend by
 *   comparing its stored snapshot price to `unit_price_minor` here.
 */
export interface PublicValidatedCart {
  currency: string;
  items: PublicValidatedItem[];
  unavailable_product_ids: string[];
  subtotal_minor: number;
}

/**
 * Integer-only subtotal from DB-authoritative prices. JavaScript numbers are
 * safe here (paise amounts are far below 2^53) but floats never enter the
 * calculation — every input is an integer from an integer column.
 */
export function calculateSubtotalMinor(products: CheckoutProductLike[]): number {
  return products.reduce((sum, product) => {
    const price = product.price_minor;
    return Number.isSafeInteger(price) && price >= 0 ? sum + price : sum;
  }, 0);
}

export function toPublicValidatedCart(
  products: CheckoutProductLike[],
  requestedIds: string[],
  primaryImageUrls: Map<string, string | null>
): PublicValidatedCart {
  const availableIds = new Set(products.map((p) => p.id));
  const currency = products[0]?.currency ?? "INR";
  const items = products.map((product) => ({
    product_id: product.id,
    product_name: product.name,
    product_slug: product.slug,
    unit_price_minor: product.price_minor,
    compare_at_price_minor: product.compare_at_price_minor,
    currency: product.currency,
    image_url: primaryImageUrls.get(product.id) ?? null,
  }));
  return {
    currency,
    items,
    unavailable_product_ids: requestedIds.filter((id) => !availableIds.has(id)),
    subtotal_minor: calculateSubtotalMinor(products),
  };
}
