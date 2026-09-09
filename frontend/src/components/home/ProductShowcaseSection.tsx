import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Product } from "../../types/product";
import { buttonClasses } from "../ui/button-styles";
import { ProductGrid } from "../ui/ProductGrid";
import { Section } from "../ui/Section";
import { useToast } from "../ui/useToast";
import { useCart } from "../../context/useCart";

export interface ProductShowcaseSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  /** Small honesty note under the heading (e.g. "sample data" notice). */
  note?: string;
  products: Product[];
  /** Renders skeleton cards while the catalog API responds (Phase 6). */
  loading?: boolean;
  tone?: "default" | "surface";
}

/** Homepage product showcase built on the reusable grid + card primitives. */
export function ProductShowcaseSection({
  id,
  eyebrow,
  title,
  description,
  note,
  products,
  loading = false,
  tone = "default"
}: ProductShowcaseSectionProps) {
  const { notify } = useToast();
  const { addItem, has } = useCart();

  return (
    <Section
      id={id}
      tone={tone}
      eyebrow={eyebrow}
      title={title}
      description={description}
      action={
        <Link to="/products" className={buttonClasses("outline", "sm")}>
          View all products
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      {note ? <p className="mb-6 text-xs text-subtle-foreground">{note}</p> : null}
            <ProductGrid
        products={loading ? undefined : products}
        loading={loading}
        skeletonCount={4}
        onAddToCart={(product) => {
          if (has(product.id)) {
            notify(`“${product.name}” is already in your cart.`);
            return;
          }
          addItem({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            priceMinor: product.price.amountMinor,
            currency: product.price.currency,
            ...(product.imageUrl
              ? { imageUrl: product.imageUrl, imageAlt: product.imageAlt ?? product.name }
              : {}),
          });
          notify(`“${product.name}” added to cart.`);
        }}
      />
    </Section>
  );
}
