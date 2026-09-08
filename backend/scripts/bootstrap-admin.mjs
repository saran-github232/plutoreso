/**
 * One-time admin bootstrap CLI (Phase 4 / Master Guide §37).
 *
 * Creates the FIRST owner admin safely. Safe to re-run: if an admin with the
 * given email already exists, it refuses to overwrite (no accidental password
 * reset, no duplicate).
 *
 * Usage (credentials via env vars — NEVER committed):
 *   node scripts/bootstrap-admin.mjs
 *
 * Required env:
 *   BOOTSTRAP_ADMIN_EMAIL     — admin email (lowercased, trimmed)
 *   BOOTSTRAP_ADMIN_PASSWORD  — plaintext password (hashed before storage)
 *   BOOTSTRAP_ADMIN_NAME      — display name (optional, defaults to "Owner")
 *
 * DATABASE_URL must be set and the `admins` migration applied.
 *
 * The bootstrap is server-only: credentials travel only through env vars,
 * are hashed with Argon2id, and are never logged.
 */
import "dotenv/config";
import argon2 from "argon2";
import { query, getPool, checkDatabase } from "../src/db/client.js";

const email = (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "";
const name = (process.env.BOOTSTRAP_ADMIN_NAME ?? "Owner").trim();

function fail(msg) {
  console.error(`[bootstrap] ${msg}`);
  process.exit(1);
}

if (!email || !password) {
  fail(
    "BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set. " +
      "Example:\n  BOOTSTRAP_ADMIN_EMAIL=you@example.com BOOTSTRAP_ADMIN_PASSWORD=... node scripts/bootstrap-admin.mjs"
  );
}

if (password.length < 8) {
  fail("Password must be at least 8 characters.");
}

const health = await checkDatabase();
if (health.status !== "ok") {
  fail(`Database not reachable (${health.reason}). Set DATABASE_URL and apply migrations first.`);
}

// Existing admin check — never overwrite.
const existing = await query(
  "SELECT id FROM admins WHERE email = $1 LIMIT 1;",
  [email]
);
if (existing.length > 0) {
  fail(`Admin "${email}" already exists. Bootstrap will not overwrite an existing admin.`);
}

// Also refuse if ANY owner already exists (single-owner safety gate).
const ownerCount = await query(
  "SELECT count(*)::text FROM admins WHERE role = 'owner';"
);
if (Number(ownerCount[0]?.count ?? "0") > 0) {
  fail("An owner admin already exists. Bootstrap creates only the first owner.");
}

const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

await query(
  `INSERT INTO admins (email, name, role, status, password_hash)
   VALUES ($1, $2, 'owner', 'active', $3);`,
  [email, name, passwordHash]
);

// Audit the bootstrap.
await query(
  `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
   SELECT id, 'admin_bootstrap', 'admins', id, $1::jsonb FROM admins WHERE email = $2;`,
  [JSON.stringify({ name }), email]
);

console.log(`[bootstrap] Owner admin created successfully for ${email}.`);

// Close the pool so the script exits cleanly.
const pool = getPool();
if (pool) await pool.end();
