import { cn } from "../../lib/cn";
import type { Product } from "../../types/product";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";

const gridClasses =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4";

export interface ProductGridProps {
  products?: Product[];
  /** Renders skeleton cards instead of products while data loads. */
  loading?: boolean;
  skeletonCount?: number;
  onAddToCart?: (product: Product) => void;
  className?: string;
}

/** Responsive product grid: 1 col mobile → 2 tablet → 3 laptop → 4 desktop. */
export function ProductGrid({
  products,
  loading = false,
  skeletonCount = 8,
  onAddToCart,
  className
}: ProductGridProps) {
  if (loading) {
    return (
      <ul aria-busy="true" aria-label="Loading products" className={cn(gridClasses, className)}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <li key={index}>
            <ProductCardSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn(gridClasses, className)}>
      {(products ?? []).map((product) => (
        <li key={product.id}>
          <ProductCard product={product} onAddToCart={onAddToCart} />
        </li>
      ))}
    </ul>
  );
}
