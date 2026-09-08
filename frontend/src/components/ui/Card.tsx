import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

/** Elevated surface primitive — the base for cards across the storefront. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-surface shadow-card", className)}
      {...rest}
    />
  );
}
