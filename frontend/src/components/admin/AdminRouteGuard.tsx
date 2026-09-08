import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";
import { useAuth } from "../../context/useAuth";

/**
 * Frontend route guard for admin routes (Phase 4 / Master Guide §37).
 *
 * IMPORTANT: this is a UX layer only. It redirects unauthenticated users to
 * /admin/login, but the backend independently enforces authorization on every
 * protected API request. Never trust this guard as security.
 */
export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session.authenticated) {
      navigate("/admin/login", { replace: true });
    }
  }, [loading, session.authenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary-600" />
          <p className="text-sm text-muted-foreground">Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (!session.authenticated) {
    return null;
  }

  return <>{children}</>;
}
