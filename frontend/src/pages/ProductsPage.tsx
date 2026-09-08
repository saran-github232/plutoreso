import { Info } from "lucide-react";
import { Container } from "../components/ui/Container";
import { ProductGrid } from "../components/ui/ProductGrid";
import { useToast } from "../components/ui/useToast";
import { MOCK_PRODUCTS } from "../data/mock-products";

/**
 * Catalog page foundation. Shows the grid with clearly-marked sample data;
 * the real catalog is served by the backend in later phases.
 */
export function ProductsPage() {
  const { notify } = useToast();

  return (
    <>
      <section aria-labelledby="products-heading" className="border-b border-border bg-surface">
        <Container className="py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Catalog</p>
          <h1
            id="products-heading"
            className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            All products
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Browse digital products. The live catalog is managed through the Admin Panel and
            served by the backend in later phases.
          </p>
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        <p className="mb-6 flex items-start gap-2 rounded-lg border border-warning-soft bg-warning-soft px-3 py-2.5 text-xs font-medium text-warning-foreground sm:items-center sm:text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" aria-hidden="true" />
          <span>
            Preview data only — sample products demonstrate the design system. Real products
            arrive via the Admin Panel.
          </span>
        </p>
        <ProductGrid
          products={MOCK_PRODUCTS}
          onAddToCart={(product) =>
            notify(`“${product.name}” — cart & checkout arrive in a later phase.`)
          }
        />
      </Container>
    </>
  );
}
