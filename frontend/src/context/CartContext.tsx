import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CartContext, type CartItem, type CartContextValue } from "./cart-context";

interface StoredCart {
  /** Incremented when the on-disk shape changes; unknown versions are reset. */
  v: number;
  items: CartItem[];
}

const STORAGE_KEY = "plutoreso.cart.v1";

function readStorage(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as StoredCart).v === 1 &&
      Array.isArray((parsed as StoredCart).items)
    ) {
      return (parsed as StoredCart).items.filter((item): item is CartItem =>
        typeof item?.productId === "string"
      );
    }
  } catch {
    // Corrupted JSON or incompatible shape — fall back to an empty cart and
    // clear the bad value so we don't keep failing on every render.
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  return [];
}

function writeStorage(items: CartItem[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, items }));
  } catch {
    /* storage full / disabled — persistence silently degrades */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStorage());

  // Persist on every change (debounced by React's batching; small payload).
  useEffect(() => {
    writeStorage(items);
  }, [items]);

  const count = items.length;
  const subtotalMinor = useMemo(
    () => items.reduce((sum, item) => sum + (item.priceMinor ?? 0), 0),
    [items]
  );

  const has = useCallback(
    (productId: string) => items.some((item) => item.productId === productId),
    [items]
  );

  const addItem = useCallback(
    (item: Omit<CartItem, "addedAt">): boolean => {
      const { productId, ...rest } = item;
      setItems((current) => {
        if (current.some((existing) => existing.productId === productId)) {
          return current;
        }
        return [...current, { productId, ...rest, addedAt: new Date().toISOString() }];
      });
      return true;
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const removeItems = useCallback((productIds: string[]) => {
    const toRemove = new Set(productIds);
    setItems((current) => current.filter((item) => !toRemove.has(item.productId)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({ items, count, subtotalMinor, has, addItem, removeItem, removeItems, clear }),
    [items, count, subtotalMinor, has, addItem, removeItem, removeItems, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
