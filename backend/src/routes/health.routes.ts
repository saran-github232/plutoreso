import { Router } from "express";
import { env } from "../config/env.js";

export const healthRouter = Router();

/**
 * Liveness/readiness probe.
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
