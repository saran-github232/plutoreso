import { Link } from "react-router-dom";
import { LayoutGrid, LogOut, ShieldCheck, Tag } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { useAuth } from "../context/useAuth";

/**
 * Admin dashboard shell (Phase 4–5 / Master Guide §17–§18).
 *
 * This page proves authentication works and links to the Phase 5 catalog
 * management modules (products, categories). Order views, coupons, bundles,
 * and analytics belong to later phases.
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

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                to="/admin/products"
                className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary-300 hover:shadow-card"
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  <span className="font-semibold text-foreground">Products</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create, edit, activate, deactivate, and archive products.
                </p>
              </Link>
              <Link
                to="/admin/categories"
                className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary-300 hover:shadow-card"
              >
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  <span className="font-semibold text-foreground">Categories</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage product categories and their display order.
                </p>
              </Link>
            </div>

            <div className="mt-8 rounded-lg border border-dashed border-border bg-background p-6">
              <h2 className="text-sm font-semibold text-foreground">Coming in later phases</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Order views, coupon and bundle configuration, analytics, and
                customer management arrive in future phases (Phase 7+).
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
