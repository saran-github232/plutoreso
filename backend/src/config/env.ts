import { z } from "zod";

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
    CLIENT_ORIGIN: z.string().trim().optional()
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === "production" && !value.CLIENT_ORIGIN) {
      ctx.addIssue({
        code: "custom",
        message:
          "CLIENT_ORIGIN is required when NODE_ENV=production so CORS can allow only the trusted frontend origin."
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
