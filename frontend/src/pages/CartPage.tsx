import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Package, ShoppingCart, Trash2 } from "lucide-react";
import { useCart, type CartItem } from "../context/useCart";
import {
  CheckoutApiError,
  type ValidatedCart,
  validateCart,
} from "../lib/checkout";
import { formatMoney } from "../lib/money";
import { buttonClasses } from "../components/ui/button-styles";
import { Container } from "../components/ui/Container";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PriceDisplay } from "../components/ui/PriceDisplay";

function moneyFromItem(item: { priceMinor: number; currency: string }) {
  return { amountMinor: item.priceMinor, currency: item.currency };
}

/**
 * Cart page (Phase 7).
 *
 * Shows the centralized cart, revalidates it against authoritative DB prices
 * on load, flags items that are no longer available or whose price changed,
 * and routes to checkout. Displayed money is UX-only — the server recomputes
 * authoritative totals before any order is created.
 */
export function CartPage() {
  const { items, count, subtotalMinor, removeItem, removeItems, clear } =
    useCart();
  const [validated, setValidated] = useState<ValidatedCart | null>(null);
  const [validating, setValidating] = useState(count > 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (count === 0) {
      setValidated(null);
      return;
    }
    setValidating(true);
    setError(null);
    const controller = new AbortController();
    validateCart(items.map((i) => ({ product_id: i.productId })), controller.signal)
      .then((res) => {
        setValidated(res.cart);
        if (res.cart.unavailable_product_ids.length > 0) {
          removeItems(res.cart.unavailable_product_ids);
        }
      })
      .catch((err) => {
        if (err instanceof CheckoutApiError) {
          setError(err.message);
        } else {
          setError("Could not verify your cart.");
        }
      })
      .finally(() => setValidating(false));
    return () => controller.abort();
  }, [count, items, removeItems]);

  // Authoritative prices when available; otherwise the stored snapshot.
  type CartLineItem = CartItem & {
    authoritativePrice?: ValidatedCart["items"][number];
    snapshotChanged?: boolean;
  };
  const lineItems = useMemo<CartLineItem[]>(() => {
    const priceById = validated
      ? new Map(validated.items.map((v) => [v.product_id, v]))
      : null;
    return items.map((item) => {
      if (!priceById) {
        return item;
      }
      const v = priceById.get(item.productId);
      if (!v) {
        return item;
      }
      const snapshotChanged =
        v.unit_price_minor !== item.priceMinor || v.currency !== item.currency;
      return { ...item, authoritativePrice: v, snapshotChanged };
    });
  }, [items, validated]);

    const pricesChanged =
    validated !== null &&
    items.some(
      (item) =>
        validated.items.some(
          (v) =>
            v.product_id === item.productId &&
            (v.unit_price_minor !== item.priceMinor || v.currency !== item.currency)
        )
    );

  const authoritativeTotal = validated
    ? formatMoney({ amountMinor: validated.subtotal_minor, currency: validated.currency })
    : items.length > 0
      ? formatMoney(
          moneyFromItem({
            priceMinor: subtotalMinor,
            currency: items[0]?.currency ?? "INR",
          })
        )
      : "—";

  if (count === 0) {
    return (
      <Container className="py-16 sm:py-24">
        <EmptyState
          icon={<ShoppingCart />}
          title="Your cart is empty"
          description="Browse the catalog and add the products you want. Your cart is saved here as you shop."
          action={
            <Link to="/products" className={buttonClasses("primary", "md")}>
              Browse products
            </Link>
          }
        />
      </Container>
    );
  }

    if (error) {
    return (
      <Container className="py-16 sm:py-24">
        <ErrorState
          title="Could not verify your cart"
          description={error}
          onRetry={() => window.location.reload()}
        />
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Your cart ({count} {count === 1 ? "item" : "items"})
      </h1>

      {pricesChanged ? (
        <p
          role="status"
          className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800"
        >
          The price of one or more items changed since you added it. The current
          prices are shown below — you are charged only the updated amounts.
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {validating ? (
          <p className="text-sm text-muted-foreground">Checking your cart…</p>
        ) : (
          lineItems.map((item) => {
            const price = item.authoritativePrice ?? {
              unit_price_minor: item.priceMinor,
              currency: item.currency,
              product_name: item.name,
              product_slug: item.slug,
            };
            return (
              <article
                key={item.productId}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.imageAlt ?? item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-primary-300" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {price.product_name} — one license (digital download)
                  </p>
                </div>
                <div className="text-right">
                  <PriceDisplay
                    price={{
                      amountMinor: price.unit_price_minor,
                      currency: price.currency,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.name} from cart`}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-danger hover:text-danger/80"
                  >
                    <Minus className="h-3 w-3" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <dl className="flex justify-between text-base">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-semibold text-foreground">{authoritativeTotal}</dd>
        </dl>
        <p className="mt-1 text-xs text-muted-foreground">
          Digital products — one license per purchase. Quantity is fixed at 1.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Link to="/products" className={buttonClasses("outline", "md")}>
          Continue shopping
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={clear}
            className={buttonClasses("outline", "md")}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear cart
          </button>
          <Link to="/checkout" className={buttonClasses("primary", "md")}>
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Proceed to checkout
          </Link>
        </div>
      </div>
    </Container>
  );
}
