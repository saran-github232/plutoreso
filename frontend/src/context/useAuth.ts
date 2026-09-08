import { createContext, useContext } from "react";
import type { AuthContextValue } from "./authTypes";

/**
 * Admin authentication context (Phase 4 / Master Guide §37).
 * The backend is the source of truth; this context simply reflects the state
 * reported by GET /api/auth/session.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Access the admin authentication context.
 * Throws if used outside an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
