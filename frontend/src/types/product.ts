import type { Money } from "../lib/money";

/**
 * Frontend product model — the storefront projection of the Master Guide
 * product model (§3). Backend phases will expand this into the full
 * database-backed entity; these fields are everything the UI needs today.
 */
export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  price: Money;
  compareAtPrice?: Money;
  /** Key selling points; the card highlights the first one. */
  benefits: string[];
  category?: string;
  /** Optional image URL; when absent the card renders a branded placeholder. */
  imageUrl?: string;
  imageAlt?: string;
  isFeatured: boolean;
  isBestSeller: boolean;
}

/** True when the product has a valid, higher compare-at price. */
export function isDiscounted(product: Product): boolean {
  return Boolean(
    product.compareAtPrice &&
      product.compareAtPrice.amountMinor > product.price.amountMinor &&
      product.compareAtPrice.currency === product.price.currency
  );
}
