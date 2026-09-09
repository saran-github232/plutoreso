import { useContext } from "react";
import { CartContext, type CartContextValue } from "./cart-context";

export type { CartContextValue, CartItem } from "./cart-context";

/**
 * Access the centralized cart from any component inside `<CartProvider>`.
 *
 * The hook lives in its own file so `CartContext.tsx` exports only the
 * `<CartProvider>` component — keeping React Fast Refresh valid.
 */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
