import { Router } from "express";
import { checkDatabase } from "../db/client.js";
import { env } from "../config/env.js";

export const healthRouter = Router();

/**
 * Liveness/readiness probe — process health only.
 * Deliberately does NOT claim the database is healthy (see /db below).
 * Safe to expose publicly — contains no secrets or internal details.
 */
healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "plutoreso-backend",
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

/**
 * Database readiness probe — a real `select 1` round-trip.
 * Responds 200 only when the database is actually reachable; otherwise 503
 * with a safe reason ("not_configured" | "unreachable"). Never exposes
 * connection details or raw driver errors to clients.
 */
healthRouter.get("/db", async (_req, res) => {
  const health = await checkDatabase();

  if (health.status === "ok") {
    res.status(200).json({
      status: "ok",
      database: "reachable",
      latencyMs: health.latencyMs,
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(503).json({
    status: "unavailable",
    database: health.reason ?? "unreachable",
    timestamp: new Date().toISOString()
  });
});
