/**
 * Admin authentication context types (Phase 4 / Master Guide §37).
 *
 * The backend is the source of truth: the AuthContext simply reflects the state
 * reported by GET /api/auth/session. Frontend route guards are UX only — the
 * backend independently enforces authorization on every protected request.
 */

export interface AdminIdentity {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface SessionState {
  authenticated: boolean;
  admin: AdminIdentity | null;
}

export interface AuthContextValue {
  session: SessionState;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
