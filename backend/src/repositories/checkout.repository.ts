import type { Pool, PoolClient } from "pg";
import type {
  CustomerId,
  CustomerRow,
  OrderId,
  OrderItemRow,
  OrderRow,
} from "../db/types.js";
import { query } from "../db/client.js";

/**
 * Checkout data-access (Phase 7 — cart/checkout foundation).
 *
 * - All SQL is parameterized (Master Guide §25).
 * - Order creation runs inside the caller's transaction (a `PoolClient`
 *   obtained from `getPool().connect()` between `BEGIN` and `COMMIT`), so an
 *   order and its item snapshots commit atomically.
 */

/** Server-side, active-only product projection needed to build an order. */
export interface CheckoutProductRow {
  id: string;
  name: string;
  slug: string;
  price_minor: number;
  compare_at_price_minor: number | null;
  currency: string;
  sort_order: number;
}

/** Both the global `query()` pool and a transactional `PoolClient` accept SQL. */
export type Executor = Pool | PoolClient;

const ACTIVE_PRODUCT_COLUMNS = `id, name, slug, price_minor, compare_at_price_minor,
  currency, sort_order`;

/**
 * Authoritative active products for the given IDs, read fresh from the DB.
 * Inactive / archived / unknown IDs are simply not returned.
 */
export async function getActiveProductsByIds(
  executor: Executor,
  productIds: string[]
): Promise<CheckoutProductRow[]> {
  if (productIds.length === 0) {
    return [];
  }
  const result = await executor.query<CheckoutProductRow>(
    `SELECT ${ACTIVE_PRODUCT_COLUMNS}
     FROM products
     WHERE id = ANY($1::uuid[]) AND status = 'active'
     ORDER BY sort_order ASC, name ASC`,
    [productIds]
  );
  return result.rows;
}

/** Returns the primary image URL per product (for cart display only). */
export async function getPrimaryImageUrls(
  executor: Executor,
  productIds: string[]
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (productIds.length === 0) {
    return map;
  }
    const { rows } = await executor.query<{
    product_id: string;
    url: string;
  }>(
    `SELECT pm.product_id, pm.url
     FROM product_media pm
     WHERE pm.product_id = ANY($1::uuid[]) AND pm.media_type = 'image'
     ORDER BY pm.sort_order ASC, pm.created_at ASC`,
    [productIds]
  );
  for (const row of rows) {
    if (!map.has(row.product_id)) {
      map.set(row.product_id, row.url);
    }
  }
  return map;
}

export async function findCustomerByEmail(email: string): Promise<CustomerRow | null> {
  const rows = await query<CustomerRow>(
    `SELECT * FROM customers WHERE email = $1 LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

/**
 * Upserts a customer by case-insensitive email (citext unique index). Existing
 * name/phone are filled in only when the new value is non-empty, so a later
 * guest checkout with a different phone cannot blank an earlier record.
 */
export async function upsertCustomerByEmail(
  executor: Executor,
  input: { email: string; name: string; phone?: string | null }
): Promise<CustomerRow> {
      const { rows } = await executor.query<CustomerRow>(
    `INSERT INTO customers (email, name, phone)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE
       SET name = COALESCE(EXCLUDED.name, customers.name),
           phone = COALESCE(EXCLUDED.phone, customers.phone),
           updated_at = now()
     RETURNING *`,
    [input.email, input.name, input.phone ?? null]
  );
  const customer = rows[0];
  if (!customer) {
    throw new Error("Failed to create customer");
  }
  return customer;
}

/**
 * Dedupe helper for `client_request_id` reuse: the most recent PENDING order
 * for the customer created within the dedupe window (plus its items) so the
 * controller can decide whether its product set matches the incoming cart
 * before reusing it.
 */
export async function findRecentPendingOrderWithItems(
  executor: Executor,
  customerId: CustomerId,
  windowMinutes: number
): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
    const orderRows = await executor.query<OrderRow>(
    `SELECT * FROM orders
     WHERE customer_id = $1
       AND status = 'PENDING'
       AND created_at >= now() - ($2 || ' minutes')::interval
     ORDER BY created_at DESC
     LIMIT 1`,
    [customerId, String(windowMinutes)]
  );
  const order = orderRows.rows[0];
  if (!order) {
    return null;
  }
  const itemRows = await executor.query<OrderItemRow>(
    `SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC`,
    [order.id]
  );
  return { order, items: itemRows.rows };
}

export async function listOrderItemsForOrder(orderId: OrderId): Promise<OrderItemRow[]> {
  return query<OrderItemRow>(
    `SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC`,
    [orderId]
  );
}

export interface NewOrderItemInput {
  productId: string;
  productName: string;
  productSlug: string;
  unitPriceMinor: number;
  compareAtPriceMinor: number | null;
  quantity: number;
  lineTotalMinor: number;
}

/**
 * Creates a PENDING order plus its item snapshots in the caller's transaction.
 *
 * Snapshots (`order_items.product_name_snapshot`, `unit_price_minor`,
 * `line_total_minor`) come from the database at checkout time, so later
 * product edits never rewrite historical pricing. The order_number is
 * generated by the Phase 3 `order_number_seq` sequence default
 * (`PLT-YYYY-NNNNNN`); nothing here supplies a manual number. No payment row
 * is created and the order is never marked PAID — Phase 8 (Razorpay) owns that
 * transition.
 */
export async function createPendingOrderWithItems(
  executor: Executor,
  input: {
    customerId: CustomerId;
    subtotalMinor: number;
    totalMinor: number;
    currency: string;
    items: NewOrderItemInput[];
  }
): Promise<{ order: OrderRow; items: OrderItemRow[] }> {
  const orderResult = await executor.query<OrderRow>(
    `INSERT INTO orders
       (customer_id, status, subtotal_minor, discount_minor, total_minor, currency)
     VALUES ($1, 'PENDING', $2, 0, $3, $4)
     RETURNING *`,
    [input.customerId, input.subtotalMinor, input.totalMinor, input.currency]
  );
    const order = orderResult.rows[0];
  if (!order) {
    throw new Error("Failed to create order");
  }

  const itemRows: OrderItemRow[] = [];
  for (const item of input.items) {
    const itemResult = await executor.query<OrderItemRow>(
      `INSERT INTO order_items
         (order_id, product_id, product_name_snapshot, product_slug_snapshot,
          unit_price_minor, compare_at_price_minor, quantity,
          line_discount_minor, line_total_minor)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
       RETURNING *`,
      [
        order.id,
        item.productId,
        item.productName,
        item.productSlug,
        item.unitPriceMinor,
        item.compareAtPriceMinor,
        item.quantity,
        item.lineTotalMinor,
      ]
    );
    const savedItem = itemResult.rows[0];
    if (!savedItem) {
      throw new Error("Failed to create order item");
    }
    itemRows.push(savedItem);
  }

  return { order, items: itemRows };
}

