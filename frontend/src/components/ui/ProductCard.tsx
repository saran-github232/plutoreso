import { Link } from "react-router-dom";
import { Check, Package, ShoppingCart } from "lucide-react";
import { cn } from "../../lib/cn";
import { discountPercent } from "../../lib/money";
import type { Product } from "../../types/product";
import { Badge } from "./Badge";
import { Button, } from "./Button";
import { buttonClasses } from "./button-styles";
import { PriceDisplay } from "./PriceDisplay";
import { Skeleton } from "./Skeleton";

export interface ProductCardProps {
  product: Product;
  /** Called by Add to cart. When omitted the button renders disabled. */
  onAddToCart?: (product: Product) => void;
  className?: string;
}

/**
 * Product card foundation for database-driven products (Master Guide §8):
 * image, name, short description, key benefit, price/compare/discount and
 * both CTAs. Data comes in via props — no coupling to any data source.
 */
export function ProductCard({ product, onAddToCart, className }: ProductCardProps) {
  const discount = product.compareAtPrice
    ? discountPercent(product.price, product.compareAtPrice)
    : null;
  const detailHref = `/products/${product.slug}`;
  const firstBenefit = product.benefits[0];

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card-hover",
        className
      )}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt ?? product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="h-10 w-10 text-primary-300" aria-hidden="true" />
        )}
        {discount ? (
          <Badge variant="discount" className="absolute left-3 top-3">
            −{discount}%
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <h3 className="font-display text-base font-semibold text-foreground">
          <Link to={detailHref} className="transition-colors hover:text-primary-700">
            {product.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {product.shortDescription}
        </p>
        {firstBenefit != null ? (
          <p className="flex items-start gap-1.5 text-sm text-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <span className="line-clamp-1">{firstBenefit}</span>
          </p>
        ) : null}

        <div className="mt-auto pt-2">
          <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link to={detailHref} className={buttonClasses("outline", "sm", "justify-center")}>
            View details
          </Link>
          <Button
            size="sm"
            disabled={!onAddToCart}
            onClick={onAddToCart ? () => onAddToCart(product) : undefined}
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Add to cart
          </Button>
        </div>
      </div>
    </article>
  );
}

/** Loading placeholder matching the card geometry. */
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-xl border border-border bg-surface shadow-card"
    >
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-24" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      </div>
    </div>
  );
}
