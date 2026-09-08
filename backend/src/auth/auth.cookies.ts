import type { Request, Response } from "express";
import { verifySession, SESSION_TTL_MS, type SessionPrincipal } from "./session.manager.js";

/**
 * Reusable auth transport helpers (Phase 4 / Master Guide §37).
 *
 * Keeps the cookie/token plumbing separate from the controller handlers so
 * both the controller and the route-protection middleware share one source of
 * truth for cookie names, attributes, and token extraction.
 */

/** Cookie name for the server-side session token. */
export const SESSION_COOKIE_NAME = "plutoreso_session";

/** Safe client-facing shape of an authenticated admin. */
export interface AdminIdentity {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/** Extract the opaque session token from the cookie jar. */
export function extractSessionToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const idx = trimmed.indexOf("=");
    if (idx <= 0) {
      continue;
    }
    if (trimmed.slice(0, idx) === SESSION_COOKIE_NAME) {
      return trimmed.slice(idx + 1);
    }
  }
  return undefined;
}

/** Write the session cookie with security-conscious attributes. */
export function setSessionCookie(
  res: Response,
  token: string,
  maxAge: number = SESSION_TTL_MS
): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

/** Clear the session cookie on logout. */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
}

/** Resolve the authenticated admin principal from the request, or null. */
export async function resolvePrincipal(
  req: Request
): Promise<SessionPrincipal | null> {
  const token = extractSessionToken(req);
  if (!token) {
    return null;
  }
  return verifySession(token);
}

export { SESSION_TTL_MS };
