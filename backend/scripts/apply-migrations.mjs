/**
 * Applies backend/supabase/migrations/*.sql in filename order.
 * Applied files are tracked in schema_migrations, so re-running is safe.
 *
 * Usage:  npm run db:migrate   (from backend/)
 * Requires DATABASE_URL in the environment (backend/.env — server-side only,
 * never committed). TLS: DATABASE_SSL=true|false overrides; otherwise remote
 * hosts get TLS and localhost does not.
 *
 * Alternative: `supabase db push` via the Supabase CLI (see docs/DATABASE.md).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import pg from "pg";

const migrationsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "migrations"
);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "[db:migrate] DATABASE_URL is not set. Configure backend/.env first (never commit it)."
  );
  process.exit(1);
}

const ssl = (() => {
  if (process.env.DATABASE_SSL === "true") return { rejectUnauthorized: false };
  if (process.env.DATABASE_SSL === "false") return false;
  const host = new URL(connectionString).hostname;
  return ["localhost", "127.0.0.1", "::1"].includes(host)
    ? false
    : { rejectUnauthorized: false };
})();

const pool = new pg.Pool({ connectionString, ssl, max: 1 });

async function main() {
  await pool.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const applied = new Set(
    (await pool.query("select filename from schema_migrations")).rows.map((row) => row.filename)
  );
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

  if (files.length === 0) {
    console.log("[db:migrate] No migration files found.");
    return;
  }

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`= ${file} (already applied)`);
      continue;
    }
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into schema_migrations (filename) values ($1)", [file]);
      await client.query("commit");
      console.log(`+ ${file} applied`);
    } catch (error) {
      await client.query("rollback");
      console.error(`! ${file} FAILED:`, error instanceof Error ? error.message : error);
      process.exitCode = 1;
      break;
    } finally {
      client.release();
    }
  }
}

main()
  .catch((error) => {
    console.error("[db:migrate] fatal:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
