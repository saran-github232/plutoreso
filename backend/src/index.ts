import "dotenv/config";
import { closeDatabase } from "./db/client.js";
import { createApp } from "./app.js";
import { env, isProduction } from "./config/env.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[api] PlutoReso backend listening on port ${env.PORT} (${env.NODE_ENV})`);
  if (!isProduction) {
    console.log(`[api] Health check: http://localhost:${env.PORT}/api/health`);
  }
});

// Graceful shutdown — Render sends SIGTERM on stop/redeploy (Master Guide §34).
function shutdown(signal: string): void {
  console.log(`[api] ${signal} received — shutting down gracefully`);
  server.close(() => {
    void closeDatabase().finally(() => process.exit(0));
  });
  // Force-exit if connections do not drain in time.
  setTimeout(() => {
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
