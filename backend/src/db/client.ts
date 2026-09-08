import { Pool } from "pg";
import { env } from "../config/env.js";

/**
 * Server-side PostgreSQL access (Supabase Postgres — Master Guide §23).
 *
 * - The pool is created lazily so the API still boots (and /api/health stays
 *   honest) when DATABASE_URL is not configured yet.
 * - Credentials live exclusively in backend environment variables; nothing
 *   here is ever importable by frontend code.
 */
let pool: Pool | null = null;

function isLocalDatabase(url: URL): boolean {
  return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
}

function resolveSsl(): boolean | { rejectUnauthorized: false } {
  if (env.DATABASE_SSL != null) {
    return env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false;
  }
  if (!env.DATABASE_URL) {
    return false;
  }
  try {
    // Remote hosts (e.g. Supabase poolers) require TLS; localhost does not.
    return isLocalDatabase(new URL(env.DATABASE_URL)) ? false : { rejectUnauthorized: false };
  } catch {
    return false;
  }
}

export function getPool(): Pool | null {
  if (!env.DATABASE_URL) {
    return null;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: resolveSsl(),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    });
  }
  return pool;
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured");
    this.name = "DatabaseNotConfiguredError";
  }
}

/**
 * Parameterized query helper. Callers MUST pass user input as $n params —
 * never interpolate values into SQL (Master Guide §25).
 */
export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const activePool = getPool();
  if (!activePool) {
    throw new DatabaseNotConfiguredError();
  }
  const result = await activePool.query(text, params);
  return result.rows as T[];
}

export interface DatabaseHealth {
  status: "ok" | "unreachable";
  latencyMs?: number;
  reason?: "not_configured" | "unreachable";
}

/** Readiness probe: a real `select 1` round-trip, or an honest failure. */
export async function checkDatabase(): Promise<DatabaseHealth> {
  const activePool = getPool();
  if (!activePool) {
    return { status: "unreachable", reason: "not_configured" };
  }
  const startedAt = performance.now();
  try {
    await activePool.query("select 1");
    return { status: "ok", latencyMs: Math.round(performance.now() - startedAt) };
  } catch (error) {
    // Technical detail goes to server-side logs only (without the connection
    // string); clients get a safe, generic response from the route layer.
    console.error("[db] health check failed:", error instanceof Error ? error.message : error);
    return { status: "unreachable", reason: "unreachable" };
  }
}

/** Closes the pool (graceful shutdown). */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
