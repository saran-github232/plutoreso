import { Link } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { useAuth } from "../context/useAuth";

/**
 * Minimal protected admin shell (Phase 4 / Master Guide §37).
 *
 * This page proves authentication works. It is intentionally sparse — full Admin
 * Product Management, category/media management, order views, coupons, bundles,
 * and analytics all belong to Phase 5+. The backend independently enforces
 * authorization on every protected request; this page merely reflects auth state.
 */
export function AdminDashboardPage() {
  const { session, logout } = useAuth();
  const admin = session.admin;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <span className="text-lg font-bold text-foreground">PlutoReso Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {admin?.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="ml-1.5">Sign out</span>
            </Button>
          </div>
        </Container>
      </header>

      <main className="py-10 sm:py-14">
        <Container>
          <Card className="p-6 sm:p-8">
            <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {admin?.name ?? admin?.email}
              </span>{" "}
              {admin?.role ? (
                <span className="text-subtle-foreground">({admin.role})</span>
              ) : null}
              .
            </p>

            <div className="mt-6 rounded-lg border border-border bg-background p-4">
              <h2 className="text-sm font-semibold text-foreground">Session status</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your session is authenticated and active. The backend validated your
                credentials and issued a secure, HttpOnly session cookie.
              </p>
            </div>

            <div className="mt-8 rounded-lg border border-dashed border-border bg-background p-6">
              <h2 className="text-sm font-semibold text-foreground">Coming in Phase 5+</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This dashboard will expand to include product management, category and
                media management, order views, coupon and bundle configuration, and
                analytics. Those modules are intentionally not built in this phase.
              </p>
            </div>

            <div className="mt-8">
              <Link to="/" className="text-sm text-primary-600 hover:text-primary-700 underline">
                ← Back to storefront
              </Link>
            </div>
          </Card>
        </Container>
      </main>
    </div>
  );
}
