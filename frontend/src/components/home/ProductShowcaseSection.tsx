import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Product } from "../../types/product";
import { buttonClasses } from "../ui/button-styles";
import { ProductGrid } from "../ui/ProductGrid";
import { Section } from "../ui/Section";
import { useToast } from "../ui/useToast";

export interface ProductShowcaseSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  /** Small honesty note under the heading (e.g. "sample data" notice). */
  note?: string;
  products: Product[];
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
  tone = "default"
}: ProductShowcaseSectionProps) {
  const { notify } = useToast();

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
        products={products}
        onAddToCart={(product) =>
          notify(`“${product.name}” — cart & checkout arrive in a later phase.`)
        }
      />
    </Section>
  );
}
