import cors from "cors";
import express from "express";
import helmet from "helmet";
import { corsOrigins } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { apiRouter } from "./routes/index.js";

/**
 * Express application factory.
 * Keeps the HTTP pipeline declarative so future phases can extend it
 * (routes, auth, webhooks, entitlements) without rewrites.
 */
export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  // Trust the first proxy hop (Render/Vercel in production).
  app.set("trust proxy", 1);

  // Security headers (Master Guide §25).
  app.use(helmet());

  // CORS allowlist — only trusted frontend origins (Master Guide §25).
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    })
  );

  // Request size limits (Master Guide §25).
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));

  app.use(requestLogger);

  app.get("/", (_req, res) => {
    res.json({ name: "plutoreso-backend", status: "ok" });
  });

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
