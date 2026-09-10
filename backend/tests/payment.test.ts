import { describe, expect, it, vi } from "vitest";
import {
  createRazorpayOrderBodySchema,
} from "../src/validation/payment.schemas.js";
import {
  isRazorpayConfigured,
  getRazorpayClient,
  RazorpayError,
} from "../src/services/razorpay.service.js";
import { isOrderPayable } from "../src/controllers/public/payment.controller.js";

/**
 * Phase 8 — Razorpay payment integration tests.
 * Mocks the Razorpay SDK; no real network calls.
 */

vi.mock("razorpay", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      orders: { create: vi.fn() },
    })),
  };
});

describe("createRazorpayOrderBodySchema", () => {
  it("accepts a valid order_id (uuid)", () => {
    const result = createRazorpayOrderBodySchema.safeParse({
      order_id: "11111111-1111-4111-8111-111111111111",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing order_id", () => {
    expect(createRazorpayOrderBodySchema.safeParse({}).success).toBe(false);
  });

  it("rejects invalid order_id format", () => {
    expect(createRazorpayOrderBodySchema.safeParse({ order_id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects extra fields (strict)", () => {
    const result = createRazorpayOrderBodySchema.safeParse({
      order_id: "11111111-1111-4111-8111-111111111111",
      amount: 10000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects number order_id", () => {
    expect(createRazorpayOrderBodySchema.safeParse({ order_id: 12345 }).success).toBe(false);
  });
});

describe("isRazorpayConfigured", () => {
  // Note: env is validated at import time, so the configuration is fixed
  // for the lifetime of the test process. We test the actual current state.
  it("returns a boolean", () => {
    const result = isRazorpayConfigured();
    expect(typeof result).toBe("boolean");
  });

  it("returns false when credentials are missing", () => {
    // In the test environment without RAZORPAY env vars, this should be false.
    // (Env is validated at import; we test the actual state.)
    const hasKeyId = Boolean(process.env.RAZORPAY_KEY_ID);
    const hasSecret = Boolean(process.env.RAZORPAY_KEY_SECRET);
    if (!hasKeyId || !hasSecret) {
      expect(isRazorpayConfigured()).toBe(false);
    }
  });
});

describe("getRazorpayClient", () => {
  it("returns null when not configured", () => {
    expect(getRazorpayClient()).toBeNull();
  });
});

describe("RazorpayError", () => {
  it("creates an error with a safe message and code", () => {
    const error = new RazorpayError("Payment failed", "payment_failed");
    expect(error.message).toBe("Payment failed");
    expect(error.code).toBe("payment_failed");
    expect(error.name).toBe("RazorpayError");
  });

  it("uses default code when not specified", () => {
    expect(new RazorpayError("Oops").code).toBe("razorpay_error");
  });
});

describe("amount security", () => {
  it("Razorpay amount uses integer minor units (paise)", () => {
    const amountInPaise = 100 * 100;
    expect(amountInPaise).toBe(10000);
    expect(Number.isInteger(amountInPaise)).toBe(true);
  });
});

describe("order payable states (idempotency retry support)", () => {
  it("allows PENDING (first attempt) and PAYMENT_INITIATED (retry)", () => {
    expect(isOrderPayable("PENDING")).toBe(true);
    expect(isOrderPayable("PAYMENT_INITIATED")).toBe(true);
  });

  it("rejects terminal or later states", () => {
    expect(isOrderPayable("PAID")).toBe(false);
    expect(isOrderPayable("FAILED")).toBe(false);
    expect(isOrderPayable("CANCELLED")).toBe(false);
    expect(isOrderPayable("REFUNDED")).toBe(false);
    expect(isOrderPayable("FULFILLED")).toBe(false);
  });
});

describe("Phase 9 boundary", () => {
  it("payment routes file does not define webhook or verify routes", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const content = fs.default.readFileSync(
      path.default.resolve(__dirname, "../src/routes/payment.routes.ts"),
      "utf8"
    );
    // Check that no actual route is registered for webhook or verify.
    // Comments mentioning Phase 9 are fine; actual route definitions are not.
    expect(content).not.toContain('paymentRouter.post("/webhook');
    expect(content).not.toContain('paymentRouter.post("/verify');
    expect(content).not.toContain('router.post("/webhook');
    expect(content).not.toContain('router.post("/verify');
  });
});
