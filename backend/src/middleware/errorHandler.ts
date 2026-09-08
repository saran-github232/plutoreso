import type { NextFunction, Request, Response } from "express";
import { isProduction } from "../config/env.js";

interface HttpError extends Error {
  status?: number;
}

/** Creates a typed error carrying an HTTP status code. */
export function createApiError(status: number, message: string): HttpError {
  const error: HttpError = new Error(message);
  error.status = status;
  return error;
}

/** 404 handler for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: "Not found" } });
}

/**
 * Central error handler (Master Guide §25, §42):
 * - Internal details (stack traces, driver errors) are logged server-side only.
 * - Clients always receive a safe, understandable JSON message.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // Malformed JSON bodies -> clean 400 (body-parser marks these with a `type`).
  const errorType = (err as { type?: string } | null)?.type;
  if (errorType === "entity.parse.failed") {
    res.status(400).json({ error: { message: "Malformed JSON body" } });
    return;
  }

  const maybeStatus = (err as HttpError | null)?.status;
  const status = typeof maybeStatus === "number" ? maybeStatus : 500;
  const isClientError = status >= 400 && status < 500;

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.path}`, err);
  }

  const fallbackMessage =
    "Something went wrong while processing your request. Please try again or contact support.";
  const maybeMessage = (err as HttpError | null)?.message;
  const message = isClientError && maybeMessage ? maybeMessage : fallbackMessage;

  res.status(status).json({
    error: {
      message,
      ...(isProduction ? {} : { type: (err as Error)?.name ?? "Error" })
    }
  });
}
