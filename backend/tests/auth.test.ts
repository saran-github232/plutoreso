import { describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
  verifyPasswordStrength,
} from "../src/auth/password.js";
import { generateSessionToken } from "../src/auth/session.manager.js";
import { loginSchema } from "../src/auth/auth.controller.js";

/**
 * Phase 4 — Admin Authentication tests.
 *
 * Pure-logic tests (password hashing, token generation, input validation)
 * run without a live database. Database-dependent integration tests are
 * intentionally skipped when DATABASE_URL is not configured — see
 * docs/TESTING.md for the full verification matrix.
 */

describe("password hashing (argon2id)", () => {
  it("hashes a password and verifies the correct password", async () => {
    const hash = await hashPassword("CorrectHorse9!");
    expect(hash).toBeTypeOf("string");
    expect(hash).not.toContain("CorrectHorse9!");
    expect(hash.startsWith("$argon2id$")).toBe(true);

    const isValid = await verifyPassword("CorrectHorse9!", hash);
    expect(isValid).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("CorrectHorse9!");
    const isValid = await verifyPassword("WrongPassword1!", hash);
    expect(isValid).toBe(false);
  });

  it("produces unique hashes for the same password (random salt)", async () => {
    const a = await hashPassword("SamePassword1!");
    const b = await hashPassword("SamePassword1!");
    expect(a).not.toBe(b);
  });

  it("never stores or leaks the plaintext password", async () => {
    const password = "SecretValue#42";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    expect(hash).not.toContain(Buffer.from(password).toString("base64"));
  });
});

describe("password strength validation", () => {
  it("accepts a strong password", () => {
    const result = verifyPasswordStrength("Str0ng!Pass#2026");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a password that is too short", () => {
    const result = verifyPasswordStrength("Ab1!");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("8 characters"))).toBe(true);
  });

  it("rejects a password without uppercase", () => {
    const result = verifyPasswordStrength("lowercase1!");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Uppercase"))).toBe(true);
  });

  it("rejects a password without a digit", () => {
    const result = verifyPasswordStrength("NoDigitsHere!");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("number"))).toBe(true);
  });

  it("rejects a password without a special character", () => {
    const result = verifyPasswordStrength("NoSpecial123");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("special"))).toBe(true);
  });
});

describe("session token generation", () => {
  it("generates a cryptographically random token", () => {
    const token = generateSessionToken();
    expect(token).toBeTypeOf("string");
    // 32 bytes => 43 base64url characters (256 bits of entropy)
    expect(token).toHaveLength(43);
    expect(/^[A-Za-z0-9_-]{43}$/.test(token)).toBe(true);
  });

  it("produces unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateSessionToken()));
    expect(tokens.size).toBe(100);
  });
});

describe("login input validation (zod)", () => {
  it("accepts a valid email + password", () => {
    const result = loginSchema.safeParse({ email: "admin@plutoreso.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "admin@plutoreso.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a password exceeding max length", () => {
    const result = loginSchema.safeParse({ email: "admin@plutoreso.com", password: "a".repeat(129) });
    expect(result.success).toBe(false);
  });

  it("strips unknown fields", () => {
    const result = loginSchema.safeParse({
      email: "admin@plutoreso.com",
      password: "anything",
      role: "admin",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("role" in result.data).toBe(false);
    }
  });
});
