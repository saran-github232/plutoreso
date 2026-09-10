import { API_BASE_URL } from "./api";

/**
 * Storefront checkout API client (Phase 7 + Phase 8).
 *
 * Sends ONLY product IDs + quantity + the customer's contact details.
 * Prices, totals, currency, and order identity are NEVER accepted from the
 * browser. Only public configuration is used.
 */

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
  /** Local PlutoReso order UUID — passed to the Razorpay order endpoint. */
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

export interface PreparedCheckout {
  order: PublicOrder;
}

export interface CheckoutValidateResponse {
  cart: ValidatedCart;
}

export class CheckoutApiError extends Error {
  readonly status: number;
  readonly unavailableProductIds: string[];
  constructor(status: number, message: string, unavailableProductIds: string[] = []) {
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
    if ((error as Error).name === "AbortError") throw error;
    throw new CheckoutApiError(0, "The store is unreachable. Check your connection and try again.");
  }
  const contentType = response.headers.get("content-type");
  const data: { error?: { message?: string; unavailable_product_ids?: string[] } } =
    contentType?.includes("application/json") && response.status !== 204 ? (await response.json()) : {};
  if (response.status === 400) {
    throw new CheckoutApiError(400, data?.error?.message ?? "Invalid checkout request.", data?.error?.unavailable_product_ids ?? []);
  }
  if (response.status === 409) {
    throw new CheckoutApiError(409, data?.error?.message ?? "Some items in your cart are no longer available.", data?.error?.unavailable_product_ids ?? []);
  }
  if (response.status === 503) {
    throw new CheckoutApiError(503, "Checkout is temporarily unavailable. Please try again shortly.");
  }
  if (!response.ok) {
    throw new CheckoutApiError(response.status, "Something went wrong. Please try again.");
  }
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }
  return undefined as unknown as T;
}

export function validateCart(items: CartLineInput[], signal?: AbortSignal): Promise<CheckoutValidateResponse> {
  return post<CheckoutValidateResponse>("/api/checkout/validate", { items }, signal);
}

export function prepareCheckout(body: { items: CartLineInput[]; customer: CustomerInput; client_request_id?: string }, signal?: AbortSignal): Promise<PreparedCheckout> {
  return post<PreparedCheckout>("/api/checkout/prepare", body, signal);
}

// --- Phase 8: Razorpay payment types ---------------------------------

export interface RazorpayOrderResponse {
  razorpay_order_id: string;
  amount_minor: number;
  currency: string;
  key_id: string;
  order_number: string;
  order_status: string;
  business_name: string;
  description: string;
}

export class PaymentApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "PaymentApiError";
    this.status = status;
  }
}

export async function createRazorpayOrder(orderId: string, signal?: AbortSignal): Promise<RazorpayOrderResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/payments/razorpay/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ order_id: orderId }),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new PaymentApiError(0, "The payment service is unreachable. Check your connection and try again.");
  }
  if (response.status === 503) {
    throw new PaymentApiError(503, "Payment service is not configured. Please try again later.");
  }
  if (response.status === 404) {
    throw new PaymentApiError(404, "Order not found.");
  }
  if (response.status === 409) {
    throw new PaymentApiError(409, "This order is not available for payment. Please start a new checkout.");
  }
  if (!response.ok) {
    throw new PaymentApiError(response.status, "Failed to create a payment order. Please try again.");
  }
  return (await response.json()) as RazorpayOrderResponse;
}

/** Result returned to the frontend after a successful Razorpay payment. */
export interface RazorpayPaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
