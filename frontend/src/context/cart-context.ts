import { createContext } from "react";

/**
 * Centralized, persisted shopping cart (Phase 7).
 *
 * Business rules (Master Guide §10: digital products = one license per
 * purchase):
 * - A product can appear at most once in the cart (quantity is implicitly 1).
 * - The cart stores only product IDs plus a server-supplied display snapshot
 *   (name / price / image) for a responsive UI. The browser is NEVER
 *   authoritative for money — `/api/checkout/validate` and `/api/checkout/prepare`
 *   re-read authoritative DB prices for every order.
 * - Persistence uses a versioned localStorage key, safely parses data, and
 *   recovers from corrupted/incompatible payloads without crashing the app.
 * - No payment credentials, secrets, or Drive folder IDs are ever stored here.
 */

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  priceMinor: number;
  currency: string;
  imageUrl?: string;
  imageAlt?: string;
  /** Client-side "saved at" timestamp for staleness checks. */
  addedAt: string;
}

export interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalMinor: number;
  has: (productId: string) => boolean;
  /** Adds an item. Returns false (no-op) when the product is already in the cart. */
  addItem: (item: Omit<CartItem, "addedAt">) => boolean;
  removeItem: (productId: string) => void;
  /** Removes every product ID in the set (used after server reports them gone). */
  removeItems: (productIds: string[]) => void;
  clear: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);
