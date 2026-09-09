import { API_BASE_URL } from "./api";

/**
 * Storefront checkout API client (Phase 7).
 *
 * Sends ONLY product IDs + quantity + the customer's contact details.
 * Prices, totals, currency, and order identity are NEVER accepted from the
 * browser — the server re-reads active products from the database and
 * computes authoritative integer (minor-unit) totals before creating an order.
 *
 * Only public configuration is used (`VITE_API_URL`). No secrets, no direct
 * database access, no `drive_folder_id`, no payment provider calls.
 */

/** A cart line carrying only a product ID (quantity is 1 for digital goods). */
export interface CartLineInput {
  product_id: string;
}

export interface ValidatedCartItem {
  product_id: string;
  product_name: string;
  product_slug: string;
  unit_price_minor: number;
  compare_at_price_minor: number | null;
  currency: string;
  image_url: string | null;
}

export interface ValidatedCart {
  currency: string;
  items: ValidatedCartItem[];
  unavailable_product_ids: string[];
  subtotal_minor: number;
}

/** Customer contact details collected for an order (server is authoritative). */
export interface CustomerInput {
  name: string;
  email: string;
  phone?: string;
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
  order_number: string;
  status: string;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  total_minor: number;
  items: PublicOrderItem[];
  created_at: string;
}

export interface PreparedCheckout {
  order: PublicOrder;
}

export interface CheckoutValidateResponse {
  cart: ValidatedCart;
}

/** Typed error thrown by the checkout client (safe messages only). */
export class CheckoutApiError extends Error {
  readonly status: number;
  readonly unavailableProductIds: string[];

  constructor(
    status: number,
    message: string,
    unavailableProductIds: string[] = []
  ) {
    super(message);
    this.name = "CheckoutApiError";
    this.status = status;
    this.unavailableProductIds = unavailableProductIds;
  }
}

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw error;
    }
    throw new CheckoutApiError(
      0,
      "The store is unreachable. Check your connection and try again."
    );
  }

  const contentType = response.headers.get("content-type");
  const data: {
    error?: { message?: string; unavailable_product_ids?: string[] };
  } =
    contentType?.includes("application/json") && response.status !== 204
      ? (await response.json())
      : {};

  if (response.status === 400) {
    throw new CheckoutApiError(
      400,
      data?.error?.message ?? "Invalid checkout request.",
      data?.error?.unavailable_product_ids ?? []
    );
  }
  if (response.status === 409) {
    throw new CheckoutApiError(
      409,
      data?.error?.message ?? "Some items in your cart are no longer available.",
      data?.error?.unavailable_product_ids ?? []
    );
  }
  if (response.status === 503) {
    throw new CheckoutApiError(503, "Checkout is temporarily unavailable. Please try again shortly.");
  }
  if (!response.ok) {
    throw new CheckoutApiError(response.status, "Something went wrong. Please try again.");
  }

  // For successful JSON responses only:
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }
  return undefined as unknown as T;
}

/** Revalidates the cart against active, authoritative DB prices. */
export function validateCart(
  items: CartLineInput[],
  signal?: AbortSignal
): Promise<CheckoutValidateResponse> {
  return post<CheckoutValidateResponse>("/api/checkout/validate", { items }, signal);
}

/** Creates the PENDING, payment-ready order. Phase 8 (Razorpay) completes it. */
export function prepareCheckout(
  body: {
    items: CartLineInput[];
    customer: CustomerInput;
    client_request_id?: string;
  },
  signal?: AbortSignal
): Promise<PreparedCheckout> {
  return post<PreparedCheckout>("/api/checkout/prepare", body, signal);
}
