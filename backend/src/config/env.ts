import { z } from "zod";
import { randomBytes } from "node:crypto";

/**
 * Central, validated backend configuration.
 *
 * Rules (docs/MASTER-GUIDE.md §12, §25, §35):
 * - Secrets live only in the backend environment, never in source code.
 * - Configuration is validated at startup; the process fails fast with a
 *   clear message when required configuration is missing or invalid.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    CLIENT_ORIGIN: z.string().trim().optional(),
    // SERVER-ONLY (docs/ENVIRONMENT.md). Optional locally so the API boots
    // honestly without a database (/api/health/db reports "not_configured");
    // REQUIRED in production.
    DATABASE_URL: z.string().url().optional(),
    // Force TLS on/off for the database connection. Default: auto-detect
    // (remote hosts get TLS, localhost does not). Values: "true" | "false".
    DATABASE_SSL: z.enum(["true", "false"]).optional(),

    // --- Phase 4: Admin authentication configuration ---------------------
    // Opaque, owner-generated bootstrap token used exactly once (or more
    // times while present) to provision the first admin via the bootstrap
    // endpoint. NOT a user-facing credential. MUST be absent from source
    // control and set only by the owner. When absent, bootstrap returns 404
    // (endpoint appears not to exist).
    BOOTSTRAP_TOKEN: z.string().optional(),
    // Session cookie signing/rotation secret. Required in production.
    SESSION_SECRET: z.string().optional(),
    // Admin login brute-force protection.
    LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15)
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === "production" && !value.CLIENT_ORIGIN) {
      ctx.addIssue({
        code: "custom",
        message:
          "CLIENT_ORIGIN is required when NODE_ENV=production so CORS can allow only the trusted frontend origin.",
      });
    }
    if (value.NODE_ENV === "production" && !value.DATABASE_URL) {
      ctx.addIssue({
        code: "custom",
        message:
          "DATABASE_URL is required when NODE_ENV=production (server-side only; never exposed to the frontend).",
      });
    }
    // SESSION_SECRET is required in production for cookie tampering resistance.
    // In development a per-process ephemeral value is generated if unset
    // (see `resolvedSessionSecret`), but production must be explicit.
    if (value.NODE_ENV === "production" && !value.SESSION_SECRET) {
      ctx.addIssue({
        code: "custom",
        message:
          "SESSION_SECRET is required when NODE_ENV=production (server-side only).",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[config] Invalid backend environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";

/**
 * Session signing secret. In production this MUST be a stable, owner-provided
 * value (validated above). In non-production environments a per-process
 * ephemeral secret is generated so the server still boots for local dev
 * without configuration — but sessions will not survive a restart.
 */
export const resolvedSessionSecret: string =
  env.SESSION_SECRET ??
  (isProduction
    ? (() => {
        throw new Error("SESSION_SECRET required in production");
      })()
    : cryptoRandomSecret());

function cryptoRandomSecret(): string {
  // Node >= 19 exposes crypto.randomBytes; fine for non-prod ephemeral use.
  return randomBytes(32).toString("hex");
}

const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:4173"];

function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw) {
    return DEV_ORIGINS;
  }
  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  for (const origin of origins) {
    try {
      new URL(origin);
    } catch {
      console.error(`[config] Invalid CLIENT_ORIGIN entry: "${origin}"`);
      process.exit(1);
    }
  }
  return origins;
}

/** Trusted CORS origins. Falls back to local Vite origins during development. */
export const corsOrigins: string[] = parseCorsOrigins(env.CLIENT_ORIGIN);
