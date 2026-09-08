import { Link, useParams } from "react-router-dom";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { buttonClasses } from "../components/ui/button-styles";
import { Container } from "../components/ui/Container";
import { EmptyState } from "../components/ui/EmptyState";

/**
 * Placeholder for the future product detail page (Master Guide §9).
 * Deliberately renders no fake product data — content arrives from the
 * backend catalog in a later phase.
 */
export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <Container className="py-16 sm:py-24">
      <EmptyState
        icon={<PackageSearch />}
        title="Product pages arrive in a later phase"
        description={`Product detail pages will render the full catalog entry from the backend${
          slug ? ` (requested: ${slug})` : ""
        }. Nothing is shown here because no fake product data is used.`}
        action={
          <Link to="/products" className={buttonClasses("primary", "md")}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to products
          </Link>
        }
      />
    </Container>
  );
}
