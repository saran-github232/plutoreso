import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/useAuth";

/**
 * Admin login page (Phase 4 / Master Guide §37).
 *
 * Uses the existing Phase 2 design system. The backend is the source of truth:
 * this page only collects credentials and reflects the auth state returned by
 * POST /api/auth/login. A generic error is shown on every failure — the backend
 * deliberately does not reveal whether the email exists or the password was wrong.
 */
export function AdminLoginPage() {
  const { login, loading, error, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect already-authenticated admins to the dashboard.
  if (session.authenticated && !loading) {
    navigate("/admin", { replace: true });
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await login(email.trim(), password);
    if (ok) {
      navigate("/admin", { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Container className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-foreground">
            <Lock className="h-6 w-6 text-primary-600" aria-hidden="true" />
            PlutoReso
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Admin sign in</p>
        </div>

        <Card className="p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to access the PlutoReso admin panel.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <FormField label="Email" required error={error ?? undefined}>
              {(field) => (
                <Input
                  {...field}
                  id={field.id}
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                />
              )}
            </FormField>

            <FormField label="Password" required>
              {(field) => (
                <div className="relative">
                  <Input
                    {...field}
                    id={field.id}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </FormField>

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-subtle-foreground">
          Protected by secure server-side sessions.{" "}
          <Link to="/" className="text-primary-600 hover:text-primary-700 underline">
            Back to storefront
          </Link>
        </p>
      </Container>
    </div>
  );
}
