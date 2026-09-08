import type { NextFunction, Request, Response } from "express";

/**
 * Minimal request logger — one line per finished request.
 * Query strings are intentionally omitted so tokens or personal data
 * accidentally placed in URLs are never written to logs (Master Guide §25).
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
  });

  next();
}
