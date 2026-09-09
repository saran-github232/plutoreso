import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/useCart";
import { CheckoutApiError, prepareCheckout, type PublicOrder } from "../lib/checkout";
import { formatMoney } from "../lib/money";
import { useToast } from "../components/ui/useToast";
import { buttonClasses } from "../components/ui/button-styles";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";
import { EmptyState } from "../components/ui/EmptyState";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { PriceDisplay } from "../components/ui/PriceDisplay";
import { applyPageSeo } from "../lib/seo";

const CHECKOUT_REQUEST_ID_KEY = "plutoreso.checkout.requestId";

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cartsess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function storedRequestId(): string {
  if (typeof window === "undefined") {
    return generateRequestId();
  }
  try {
    const existing = window.sessionStorage.getItem(CHECKOUT_REQUEST_ID_KEY);
    if (existing) {
      return existing;
    }
    const fresh = generateRequestId();
    window.sessionStorage.setItem(CHECKOUT_REQUEST_ID_KEY, fresh);
    return fresh;
  } catch {
    return generateRequestId();
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Checkout page (Phase 7).
 *
 * Collects name/email/phone (only fields that exist on the Phase 3
 * `customers` table), validates the cart client-side, then creates a PENDING,
 * payment-ready order via `/api/checkout/prepare`. The server re-reads active
 * DB prices and is the sole authority on totals — the browser never sends money.
 *
 * Payment (Razorpay) is intentionally NOT here — Phase 8 owns it. On success
 * the customer sees an order-confirmation screen with a clear note that
 * payment completes in the next step.
 */
export function CheckoutPage() {
  const { items, count, subtotalMinor, clear } = useCart();
  const navigate = useNavigate();
  const { notify } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [order, setOrder] = useState<PublicOrder | null>(null);

  useEffect(() => {
    applyPageSeo({
      title: "Checkout — PlutoReso",
      description: "Complete your purchase. Payment is completed securely in the next step.",
    });
  }, []);

  const totalLabel = useMemo(() => {
    if (count === 0 || !items[0]) {
      return "—";
    }
    return formatMoney({
      amountMinor: subtotalMinor,
      currency: items[0].currency ?? "INR",
    });
  }, [count, items, subtotalMinor]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setServerError(null);

    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) {
      nextErrors.name = "Please enter your full name.";
    }
    if (!isValidEmail(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    const controller = new AbortController();
    try {
      const result = await prepareCheckout(
        {
          items: items.map((i) => ({ product_id: i.productId })),
          customer: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim() || undefined,
          },
          client_request_id: storedRequestId(),
        },
        controller.signal
      );
      if (controller.signal.aborted) return;
      setOrder(result.order);
      clear();
      notify("Order created. Check your email to complete payment.");
      try {
        window.sessionStorage.removeItem(CHECKOUT_REQUEST_ID_KEY);
      } catch {
        /* ignore */
      }
    } catch (err) {
      if (err instanceof CheckoutApiError) {
        if (err.status === 409 && err.unavailableProductIds.length > 0) {
          setServerError(
            "One or more items in your cart are no longer available. Review your cart and try again."
          );
          void navigate("/cart");
        } else {
          setServerError(err.message);
        }
      } else if ((err as Error).name === "AbortError") {
        // aborted intentionally
      } else {
        setServerError("Something went wrong while creating your order.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setSubmitting(false);
      }
    }
  }
    if (count === 0) {
    return (
      <Container className="py-16 sm:py-24">
        <EmptyState
          icon={<ShoppingCart />}
          title="Your cart is empty"
          description="You can't checkout with an empty cart. Add products first."
          action={
            <Link to="/products" className={buttonClasses("primary", "md")}>
              Browse products
            </Link>
          }
        />
      </Container>
    );
  }

  if (order) {
    return (
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Order received
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Order{" "}
            <span className="font-medium text-foreground">{order.order_number}</span> —{" "}
            status: <span className="font-medium text-foreground">{order.status}</span>.
          </p>
          <dl className="mt-4 flex justify-center gap-4 text-center">
            <div>
              <dt className="text-xs text-muted-foreground">Items</dt>
              <dd className="text-lg font-semibold text-foreground">{order.items.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Total</dt>
              <dd className="text-lg font-semibold text-foreground">
                <PriceDisplay price={{ amountMinor: order.total_minor, currency: order.currency }} />
              </dd>
            </div>
          </dl>
          <p className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Your order is registered as <strong>PENDING</strong>. Online payment
            is completed in the next step (Phase 8). We'll notify you once
            payment is processed.
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => {
                clear();
                void navigate("/");
              }}
              className={buttonClasses("primary", "lg")}
            >
              Back to home
            </button>
          </div>
        </div>
      </Container>
    );
  }
    return (
    <Container className="py-8 sm:py-12">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Checkout
      </h1>

      {serverError ? (
        <p role="alert" className="mt-4 text-sm font-medium text-danger">
          {serverError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <fieldset>
            <legend className="font-display text-lg font-semibold text-foreground">
              Contact details
            </legend>
            <p className="mt-1 text-sm text-muted-foreground">
              Used to create your account and send order updates. We never spam.
            </p>
            <div className="mt-4 grid gap-4">
              <FormField label="Full name" required error={errors.name}>
                {(field) => (
                  <Input
                    {...field}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                )}
              </FormField>
              <FormField label="Email" required error={errors.email}>
                {(field) => (
                  <Input
                    {...field}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                )}
              </FormField>
              <FormField
                label="Phone"
                hint="Optional — for order updates only"
                error={errors.phone}
              >
                {(field) => (
                  <Input
                    {...field}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                )}
              </FormField>
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="font-display text-lg font-semibold text-foreground">
              Payment
            </legend>
            <p className="mt-1 text-sm text-muted-foreground">
              Payment is completed securely in the next step. Your order is
              created and held as <strong>PENDING</strong> until you pay. No
              charge is taken until you complete payment.
            </p>
          </fieldset>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="mt-6 w-full"
          >
            {submitting ? "Creating your order…" : "Create order and pay"}
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            <Link to="/cart" className="underline hover:text-foreground">
              Back to cart
            </Link>
          </p>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Order summary
            </h2>
            <ul className="mt-3 space-y-3 text-sm">
              {items.map((item) => (
                <li key={item.productId} className="flex justify-between">
                  <span className="text-muted-foreground">{item.name}</span>
                  <PriceDisplay
                    price={{
                      amountMinor: item.priceMinor,
                      currency: item.currency,
                    }}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border pt-4">
              <dl className="flex justify-between text-base font-semibold">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="text-foreground">{totalLabel}</dd>
              </dl>
              <p className="mt-1 text-xs text-muted-foreground">
                Integer minor units (paise). Taxes included.
              </p>
            </div>
          </div>
        </div>
      </form>
    </Container>
  );
}
