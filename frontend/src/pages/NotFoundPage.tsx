import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { buttonClasses } from "../components/ui/button-styles";
import { Container } from "../components/ui/Container";
import { EmptyState } from "../components/ui/EmptyState";

/** 404 catch-all page. */
export function NotFoundPage() {
  return (
    <Container className="py-16 sm:py-24">
      <EmptyState
        icon={<Compass />}
        title="Page not found"
        description="The page you are looking for doesn't exist or may still be under construction."
        action={
          <Link to="/" className={buttonClasses("primary", "md")}>
            Go to homepage
          </Link>
        }
      />
    </Container>
  );
}
