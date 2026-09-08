import rateLimit from "express-rate-limit";

/**
 * Brute-force protection for the admin login endpoint (Phase 4 / Master Guide §37).
 *
 * Limits each IP to a small number of login attempts per window. This is a
 * defense-in-depth layer on top of the per-account lockout already implemented
 * in the auth controller (failed_login_attempts / locked_until).
 *
 * The limiter is intentionally strict: login is a low-frequency, high-sensitivity
 * action. Legitimate admins will never hit this under normal use.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  standardHeaders: true, //RateLimit-* headers
  legacyHeaders: false, //X-RateLimit-* headers
  message: {
    error: {
      message: "Too many login attempts. Please try again later.",
    },
  },
  // Skip rate limiting in test environments so integration tests run reliably.
  skip: () => process.env.NODE_ENV === "test",
});
