import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { SessionState } from "./authTypes";

/**
 * Admin authentication context (Phase 4 / Master Guide §37).
 *
 * The backend is the source of truth: this context simply reflects the state
 * reported by GET /api/auth/session. Frontend route guards are UX only — the
 * backend independently enforces authorization on every protected request.
 */

import { AuthContext } from "./useAuth";

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ authenticated: false, admin: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/session`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = (await res.json()) as SessionState;
        setSession({ authenticated: Boolean(data.authenticated), admin: data.admin ?? null });
      } else {
        setSession({ authenticated: false, admin: null });
      }
    } catch {
      setSession({ authenticated: false, admin: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          const data = (await res.json()) as SessionState;
          setSession({ authenticated: Boolean(data.authenticated), admin: data.admin ?? null });
          return true;
        }

        // Generic error — the backend deliberately does not reveal whether the
        // email exists or the password was wrong (Master Guide §37).
        setError("Invalid email or password.");
        setSession({ authenticated: false, admin: null });
        return false;
      } catch {
        setError("Unable to reach the server. Please try again.");
        setSession({ authenticated: false, admin: null });
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } catch {
      // Ignore network errors — the cookie is cleared client-side below.
    } finally {
      setSession({ authenticated: false, admin: null });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, error, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}


