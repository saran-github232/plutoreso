import { describe, expect, it } from "vitest";
import {
  cartLinesSchema,
  mergeCartItems,
  prepareCheckoutBodySchema,
  validateCheckoutBodySchema,
} from "../src/validation/checkout.schemas.js";
import {
  calculateSubtotalMinor,
  toPublicOrder,
  toPublicValidatedCart,
  type PublicOrder,
  type PublicValidatedCart,
} from "../src/controllers/public/checkout.dto.js";
import type { OrderItemRow, OrderRow } from "../src/db/types.js";

/**
 * Phase 7 — Cart & Checkout tests.
 */

const PRODUCT_A = "11111111-1111-4111-8111-111111111111";
const PRODUCT_B = "22222222-2222-4222-8222-222222222222";
const PRODUCT_C = "33333333-3333-4333-8333-333333333333";

describe("cartLinesSchema", () => {
  it("accepts a single product id with default quantity 1", () => {
    const result = cartLinesSchema.safeParse([{ product_id: PRODUCT_A }]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([{ product_id: PRODUCT_A, quantity: 1 }]);
    }
  });

  it("rejects quantity greater than 1 (one license per purchase)", () => {
    const result = cartLinesSchema.safeParse([
      { product_id: PRODUCT_A, quantity: 2 },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects zero and negative quantities", () => {
    expect(
      cartLinesSchema.safeParse([{ product_id: PRODUCT_A, quantity: 0 }]).success
    ).toBe(false);
    expect(
      cartLinesSchema.safeParse([{ product_id: PRODUCT_A, quantity: -1 }]).success
    ).toBe(false);
  });

  it("rejects non-integer quantities", () => {
    expect(
      cartLinesSchema.safeParse([
        { product_id: PRODUCT_A, quantity: 1.5 },
      ]).success
    ).toBe(false);
  });

  it("rejects an empty cart", () => {
    expect(cartLinesSchema.safeParse([]).success).toBe(false);
  });

  it("rejects more than 20 lines", () => {
    const lines = Array.from({ length: 21 }, (_, i) => ({
      product_id: `11111111-1111-4111-8111-${String(i).padStart(12, "0")}`,
    }));
    expect(cartLinesSchema.safeParse(lines).success).toBe(false);
  });

  it("rejects invalid product ids", () => {
    expect(
      cartLinesSchema.safeParse([{ product_id: "not-a-uuid" }]).success
    ).toBe(false);
  });

  it("rejects unknown fields (strict)", () => {
    expect(
      cartLinesSchema.safeParse([
        { product_id: PRODUCT_A, quantity: 1, price: 100 },
      ]).success
    ).toBe(false);
  });
});

describe("validateCheckoutBodySchema", () => {
  it("accepts a minimal validate body", () => {
    const result = validateCheckoutBodySchema.safeParse({
      items: [{ product_id: PRODUCT_A }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects bodies without items", () => {
    expect(validateCheckoutBodySchema.safeParse({}).success).toBe(false);
  });
});

describe("prepareCheckoutBodySchema", () => {
  it("accepts a complete prepare body", () => {
    const result = prepareCheckoutBodySchema.safeParse({
      items: [{ product_id: PRODUCT_A }],
      customer: {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "+91 98765 43210",
      },
      client_request_id: PRODUCT_A,
    });
    expect(result.success).toBe(true);
  });

  it("accepts when phone and client_request_id are omitted", () => {
    const result = prepareCheckoutBodySchema.safeParse({
      items: [{ product_id: PRODUCT_A }],
      customer: { name: "Jane Doe", email: "jane@example.com" },
    });
    expect(result.success).toBe(true);
  });

  it("normalizes email to lowercase", () => {
    const result = prepareCheckoutBodySchema.safeParse({
      items: [{ product_id: PRODUCT_A }],
      customer: { name: "Jane", email: "JANE@EXAMPLE.COM" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customer.email).toBe("jane@example.com");
    }
  });

  it("rejects when name is too short", () => {
    const result = prepareCheckoutBodySchema.safeParse({
      items: [{ product_id: PRODUCT_A }],
      customer: { name: "J", email: "jane@example.com" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = prepareCheckoutBodySchema.safeParse({
      items: [{ product_id: PRODUCT_A }],
      customer: { name: "Jane Doe", email: "not-an-email" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed phone", () => {
    const result = prepareCheckoutBodySchema.safeParse({
      items: [{ product_id: PRODUCT_A }],
      customer: {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "abc",
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown customer fields (strict)", () => {
    const result = prepareCheckoutBodySchema.safeParse({
      items: [{ product_id: PRODUCT_A }],
      customer: { name: "Jane Doe", email: "jane@example.com", role: "admin" },
    });
    expect(result.success).toBe(false);
  });
});

describe("mergeCartItems", () => {
  it("collapses duplicate product ids into a single line", () => {
    const merged = mergeCartItems([
      { product_id: PRODUCT_A, quantity: 1 },
      { product_id: PRODUCT_B, quantity: 1 },
      { product_id: PRODUCT_A, quantity: 1 },
    ]);
    expect(merged).toEqual([
      { product_id: PRODUCT_A, quantity: 1 },
      { product_id: PRODUCT_B, quantity: 1 },
    ]);
  });

  it("always normalizes quantity to 1", () => {
    const merged = mergeCartItems([
      { product_id: PRODUCT_A, quantity: 1 },
    ]);
    expect(merged[0]?.quantity).toBe(1);
  });

  it("preserves request order for distinct products", () => {
    const merged = mergeCartItems([
      { product_id: PRODUCT_C, quantity: 1 },
      { product_id: PRODUCT_A, quantity: 1 },
      { product_id: PRODUCT_B, quantity: 1 },
    ]);
    expect(merged.map((i) => i.product_id)).toEqual([
      PRODUCT_C,
      PRODUCT_A,
      PRODUCT_B,
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(mergeCartItems([])).toEqual([]);
  });
});

describe("calculateSubtotalMinor", () => {
  it("sums integer minor units exactly", () => {
    const total = calculateSubtotalMinor([
      { id: PRODUCT_A, name: "A", slug: "a", price_minor: 19900, compare_at_price_minor: null, currency: "INR" },
      { id: PRODUCT_B, name: "B", slug: "b", price_minor: 49900, compare_at_price_minor: 59900, currency: "INR" },
    ]);
    expect(total).toBe(69800);
  });

  it("returns 0 for an empty cart", () => {
    expect(calculateSubtotalMinor([])).toBe(0);
  });

  it("ignores negative prices (defensive)", () => {
    const total = calculateSubtotalMinor([
      { id: PRODUCT_A, name: "A", slug: "a", price_minor: 10000, compare_at_price_minor: null, currency: "INR" },
      { id: PRODUCT_B, name: "B", slug: "b", price_minor: -500, compare_at_price_minor: null, currency: "INR" },
    ]);
    expect(total).toBe(10000);
  });
});

describe("toPublicValidatedCart", () => {
  const products = [
    { id: PRODUCT_A, name: "Product A", slug: "product-a", price_minor: 19900, compare_at_price_minor: 24900, currency: "INR" },
    { id: PRODUCT_B, name: "Product B", slug: "product-b", price_minor: 49900, compare_at_price_minor: null, currency: "INR" },
  ];
  const images = new Map<string, string | null>([
    [PRODUCT_A, "https://example.com/a.jpg"],
    [PRODUCT_B, "https://example.com/b.jpg"],
  ]);

  it("returns only active products with authoritative prices", () => {
    const cart: PublicValidatedCart = toPublicValidatedCart(
      products,
      [PRODUCT_A, PRODUCT_B],
      images
    );
    expect(cart.items).toHaveLength(2);
    expect(cart.subtotal_minor).toBe(69800);
    expect(cart.currency).toBe("INR");
  });

  it("flags requested-but-missing product ids as unavailable", () => {
    const cart: PublicValidatedCart = toPublicValidatedCart(
      products,
      [PRODUCT_A, PRODUCT_B, PRODUCT_C],
      images
    );
    expect(cart.unavailable_product_ids).toEqual([PRODUCT_C]);
    expect(cart.items).toHaveLength(2);
  });

  it("never leaks drive_folder_id or internal metadata", () => {
    const cart: PublicValidatedCart = toPublicValidatedCart(
      products,
      [PRODUCT_A],
      images
    );
    const serialized = JSON.stringify(cart);
    expect(serialized).not.toContain("drive_folder_id");
    expect(serialized).not.toContain("SECRET");
  });
});

describe("toPublicOrder", () => {
  function makeOrderRow(overrides: Partial<OrderRow> = {}): OrderRow {
    return {
      id: "99999999-9999-4999-8999-999999999999",
      order_number: "PLT-2026-000042",
      customer_id: "88888888-8888-4888-8888-888888888888",
      status: "PENDING",
      subtotal_minor: 69800,
      discount_minor: 0,
      total_minor: 69800,
      currency: "INR",
      coupon_id: null,
      created_at: new Date("2026-09-10T00:00:00Z"),
      updated_at: new Date("2026-09-10T00:00:00Z"),
      ...overrides,
    } as OrderRow;
  }

  function makeItemRow(overrides: Partial<OrderItemRow> = {}): OrderItemRow {
    return {
      id: "77777777-7777-4777-8777-777777777777",
      order_id: "99999999-9999-4999-8999-999999999999",
      product_id: PRODUCT_A,
      product_name_snapshot: "Product A",
      product_slug_snapshot: "product-a",
      unit_price_minor: 19900,
      compare_at_price_minor: 24900,
      quantity: 1,
      line_discount_minor: 0,
      line_total_minor: 19900,
      created_at: new Date("2026-09-10T00:00:00Z"),
      ...overrides,
    } as OrderItemRow;
  }

  it("projects a customer-safe order DTO", () => {
    const order = makeOrderRow();
    const items = [makeItemRow()];
    const dto: PublicOrder = toPublicOrder(order, items);

    expect(dto.order_number).toBe("PLT-2026-000042");
    expect(dto.status).toBe("PENDING");
    expect(dto.total_minor).toBe(69800);
    expect(dto.items).toHaveLength(1);
    expect(dto.items[0]?.product_name).toBe("Product A");
    expect(dto.items[0]?.unit_price_minor).toBe(19900);
    expect(dto.items[0]?.line_total_minor).toBe(19900);
  });

  it("uses snapshot names, not live product names", () => {
    const order = makeOrderRow();
    const items = [makeItemRow({ product_name_snapshot: "Legacy Product A" })];
    const dto: PublicOrder = toPublicOrder(order, items);
    expect(dto.items[0]?.product_name).toBe("Legacy Product A");
  });

  it("never leaks internal fields", () => {
    const order = makeOrderRow();
    const items = [makeItemRow()];
    const dto: PublicOrder = toPublicOrder(order, items);
    const serialized = JSON.stringify(dto);

    expect(serialized).not.toContain("drive_folder_id");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("customer_id");
    expect(serialized).not.toContain("order_id");
    expect(dto).not.toHaveProperty("customer_id");
  });

  it("the order is never marked PAID by the DTO", () => {
    const order = makeOrderRow({ status: "PENDING" });
    const dto: PublicOrder = toPublicOrder(order, []);
    expect(dto.status).toBe("PENDING");
    expect(dto.status).not.toBe("PAID");
  });
});
