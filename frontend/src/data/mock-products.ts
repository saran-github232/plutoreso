import type { Product } from "../types/product";

/**
 * ⚠️ MOCK DATA — DESIGN-SYSTEM PREVIEW ONLY (Phase 2).
 *
 * These samples exist purely to demonstrate the product card, grid and
 * price components. They are NOT real PlutoReso products, must never be
 * treated as the product system, and will be replaced by the backend
 * catalog (Supabase + Admin Panel) in later phases.
 * Master Guide §49: real products are always entered by the owner.
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "mock-1",
    slug: "sample-content-creator-toolkit",
    name: "Sample — Content Creator Toolkit",
    shortDescription:
      "Placeholder card used to demonstrate the product card layout, pricing and discount display.",
    price: { amountMinor: 149900, currency: "INR" },
    compareAtPrice: { amountMinor: 199900, currency: "INR" },
    benefits: ["Demonstrates a highlighted key-benefit line"],
    category: "Samples",
    isFeatured: true,
    isBestSeller: true
  },
  {
    id: "mock-2",
    slug: "sample-freelancing-starter-guide",
    name: "Sample — Freelancing Starter Guide",
    shortDescription:
      "Second sample card so the grid shows multiple items at tablet and desktop widths.",
    price: { amountMinor: 49900, currency: "INR" },
    compareAtPrice: { amountMinor: 79900, currency: "INR" },
    benefits: ["Shows how a discounted card renders"],
    category: "Samples",
    isFeatured: true,
    isBestSeller: false
  },
  {
    id: "mock-3",
    slug: "sample-productivity-templates",
    name: "Sample — Productivity Templates",
    shortDescription: "A card without a compare-at price, showing the clean single-price layout.",
    price: { amountMinor: 29900, currency: "INR" },
    benefits: ["Demonstrates the no-discount card state"],
    category: "Samples",
    isFeatured: false,
    isBestSeller: true
  },
  {
    id: "mock-4",
    slug: "sample-video-assets-pack",
    name: "Sample — Video Assets Pack",
    shortDescription: "Fourth sample card to complete the desktop grid preview.",
    price: { amountMinor: 99900, currency: "INR" },
    compareAtPrice: { amountMinor: 129900, currency: "INR" },
    benefits: ["Completes the responsive grid preview"],
    category: "Samples",
    isFeatured: false,
    isBestSeller: true
  }
];

export const MOCK_FEATURED: Product[] = MOCK_PRODUCTS.filter((product) => product.isFeatured);
export const MOCK_BEST_SELLERS: Product[] = MOCK_PRODUCTS.filter((product) => product.isBestSeller);
