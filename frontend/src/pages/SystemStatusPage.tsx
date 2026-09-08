import { SystemStatus } from "../components/SystemStatus";
import { Container } from "../components/ui/Container";

/**
 * Development utility carried over from Phase 1: verifies the frontend can
 * reach the backend API through the public VITE_API_URL configuration.
 */
export function SystemStatusPage() {
  return (
    <Container className="py-12 sm:py-16">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        System status
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Development utility carried over from Phase 1 — checks that this frontend can reach the
        backend API.
      </p>
      <SystemStatus />
    </Container>
  );
}
