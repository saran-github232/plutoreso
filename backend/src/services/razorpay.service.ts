import Razorpay from "razorpay";
import { env } from "../config/env.js";

/**
 * Razorpay integration service (Phase 8).
 *
 * Isolates all Razorpay-specific code so the rest of the application
 * never imports the SDK directly. The service:
 *   - authenticates using Key ID + Key Secret (server-only)
 *   - creates Razorpay orders from authoritative local order amounts
 *   - normalizes provider errors into safe, internal shapes
 *   - NEVER exposes the secret or raw provider internals
 *
 * The SDK is optional at import time: when RAZORPAY_KEY_ID/SECRET are not
 * configured, `getClient()` returns null and the payment endpoints respond
 * 503 (honest, retryable). This keeps the API bootable in local dev without
 * Razorpay credentials.
 */

export interface RazorpayOrderParams {
  /** Razorpay order ID (receipt) — a stable local reference. */
  receipt: string;
  /** Amount in integer minor units (paise for INR). */
  amountMinor: number;
  /** ISO 4217 currency code, e.g. "INR". */
  currency: string;
  /** Optional notes attached to the Razorpay order (key-value pairs). */
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export class RazorpayError extends Error {
  readonly code: string;
  constructor(message: string, code: string = "razorpay_error") {
    super(message);
    this.name = "RazorpayError";
    this.code = code;
  }
}

let clientInstance: Razorpay | null | undefined = undefined;

/**
 * Returns the shared Razorpay client, or null when credentials are missing.
 * The instance is created lazily and reused.
 */
export function getRazorpayClient(): Razorpay | null {
  if (clientInstance !== undefined) {
    return clientInstance;
  }

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    clientInstance = null;
    return null;
  }

  clientInstance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });

  return clientInstance;
}

/**
 * True when Razorpay credentials are configured. Controllers use this to
 * return 503 instead of crashing when the service is intentionally unset.
 */
export function isRazorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

/**
 * Creates a Razorpay order server-side. The amount MUST come from the
 * authoritative local order — never from browser input.
 *
 * @throws RazorpayError on provider failure (safe message, no secret leaked).
 */
export async function createRazorpayOrder(
  params: RazorpayOrderParams
): Promise<RazorpayOrder> {
  const client = getRazorpayClient();
  if (!client) {
    throw new RazorpayError(
      "Payment service is not configured.",
      "razorpay_not_configured"
    );
  }

  try {
    const order = await client.orders.create({
      amount: params.amountMinor,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes ?? {},
    });

    return {
      id: order.id,
      amount: typeof order.amount === "number" ? order.amount : Number(order.amount),
      currency: order.currency ?? params.currency,
      receipt: order.receipt ?? params.receipt,
      status: order.status ?? "created",
    };
  } catch (error) {
    // Never log or re-raise the raw provider error — it may contain
    // sensitive details. Map to a safe internal error.
    const code =
      (error as { error?: { code?: string } })?.error?.code ?? "razorpay_error";
    throw new RazorpayError(
      "Failed to create a payment order. Please try again.",
      code
    );
  }
}
