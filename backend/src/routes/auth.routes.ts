import { Router } from "express";
import { login } from "../auth/auth.controller.js";
import { logout, session } from "../auth/auth.handlers.js";
import { loginRateLimiter } from "../middleware/rateLimit.js";

/**
 * Authentication routes (Phase 4 / Master Guide §37).
 *
 *   POST /api/auth/login   — validate credentials, create session (rate-limited)
 *   POST /api/auth/logout  — revoke session, clear cookie
 *   GET  /api/auth/session — return authenticated admin (or 401)
 */
export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, login);
authRouter.post("/logout", logout);
authRouter.get("/session", session);
