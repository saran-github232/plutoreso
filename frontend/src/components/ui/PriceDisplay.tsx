import { cn } from "../../lib/cn";
import { discountPercent, formatMoney, type Money } from "../../lib/money";

export interface PriceDisplayProps {
  price: Money;
  compareAtPrice?: Money;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl"
} as const;

/**
 * Reusable price display with INR formatting and optional compare-at price.
 * Currency details live in lib/money.ts so future currencies need no UI changes.
 */
export function PriceDisplay({ price, compareAtPrice, size = "md", className }: PriceDisplayProps) {
  const discount = compareAtPrice ? discountPercent(price, compareAtPrice) : null;

  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span
        className={cn(
          "font-semibold tabular-nums tracking-tight text-foreground",
          sizeClasses[size]
        )}
      >
        {formatMoney(price)}
        <span className="sr-only"> (current price)</span>
      </span>
      {compareAtPrice && discount ? (
        <>
          <s className="text-sm font-medium text-subtle-foreground">
            {formatMoney(compareAtPrice)}
            <span className="sr-only"> (original price)</span>
          </s>
          <span className="sr-only">— {discount}% off</span>
        </>
      ) : null}
    </p>
  );
}
