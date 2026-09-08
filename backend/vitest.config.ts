import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for the backend test suite (Phase 4).
 *
 * Tests run against the real auth logic. Database-dependent tests are skipped
 * when DATABASE_URL is not configured (see tests/auth.test.ts).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Auth tests may exercise argon2 (slow by design); allow generous timeouts.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
