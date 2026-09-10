import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";
import { useCart } from "../context/useCart";
import {
  CheckoutApiError,
  createRazorpayOrder,
  PaymentApiError,
  prepareCheckout,
  type PublicOrder,
  type RazorpayPaymentResult,
} from "../lib/checkout";
import { formatMoney } from "../lib/money";
import { useToast } from "../components/ui/useToast";
import { buttonClasses } from "../components/ui/button-styles";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { PriceDisplay } from "../components/ui/PriceDisplay";
import { applyPageSeo } from "../lib/seo";
import { useRazorpayScript } from "../hooks/useRazorpayScript";

const CHECKOUT_REQUEST_ID_KEY = "plutoreso.checkout.requestId";

type CheckoutStep = "form" | "confirm" | "processing" | "submitted";

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cartsess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function storedRequestId(): string {
  if (typeof window === "undefined") return generateRequestId();
  try {
    const existing = window.sessionStorage.getItem(CHECKOUT_REQUEST_ID_KEY);
    if (existing) return existing;
    const fresh = generateRequestId();
    window.sessionStorage.setItem(CHECKOUT_REQUEST_ID_KEY, fresh);
    return fresh;
  } catch { return generateRequestId(); }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact?: string };
  handler: (response: RazorpayPaymentResult) => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

export function CheckoutPage() {
  const { items, count, subtotalMinor } = useCart();
  const { notify } = useToast();
  const razorpayScript = useRazorpayScript();

  const [step, setStep] = useState<CheckoutStep>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [order, setOrder] = useState<PublicOrder | null>(null);

  useEffect(() => {
    applyPageSeo({
      title: "Checkout \u2014 PlutoReso",
      description: "Complete your purchase securely. Payment processed by Razorpay.",
    });
  }, []);

  const totalLabel = useMemo(() => {
    if (count === 0 || !items[0]) return "\u2014";
    return formatMoney({ amountMinor: subtotalMinor, currency: items[0].currency ?? "INR" });
  }, [count, items, subtotalMinor]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setServerError(null);
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Please enter your full name.";
    if (!isValidEmail(email)) next.email = "Please enter a valid email address.";
    if (phone.trim() && !/^[\d\s\-+()]{7,15}$/.test(phone.trim())) next.phone = "Please enter a valid phone number.";
    if (Object.keys(next).length > 0) { setErrors(next); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await prepareCheckout({
        items: items.map((i) => ({ product_id: i.productId })),
        customer: { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() || undefined },
        client_request_id: storedRequestId(),
      });
      setOrder(result.order);
      setStep("confirm");
    } catch (err) {
      setServerError(err instanceof CheckoutApiError ? err.message
        : err instanceof Error ? err.message : "Something went wrong creating your order.");
    } finally { setSubmitting(false); }
  }

  async function handlePay() {
    if (!order) return;
    if (!order.id) {
      setServerError("This order is missing its reference. Please start a new checkout.");
      return;
    }
    setServerError(null);
    setSubmitting(true);
    try {
      const rp = await createRazorpayOrder(order.id);
      const options: RazorpayCheckoutOptions = {
        key: rp.key_id,
        amount: rp.amount_minor,
        currency: rp.currency,
        name: rp.business_name,
        description: rp.description,
        order_id: rp.razorpay_order_id,
        prefill: { name: name.trim(), email: email.trim(), contact: phone.trim() || undefined },
        handler: () => handlePaymentSubmitted(),
        modal: { ondismiss: () => { notify("Payment cancelled. Your order is still pending."); setSubmitting(false); } },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setServerError("Payment failed. Your order is still pending \u2014 please try again.");
        setSubmitting(false);
      });
      rzp.open();
    } catch (err) {
      setServerError(err instanceof PaymentApiError || err instanceof CheckoutApiError ? err.message
        : err instanceof Error ? err.message : "Something went wrong preparing payment.");
      setSubmitting(false);
    }
  }

  function handlePaymentSubmitted() {
    setStep("submitted");
    setSubmitting(false);
    notify("Payment submitted! We will verify and confirm your order shortly.");
  }

  if (count === 0 && step === "form") {
    return (
      <Container className="py-12">
        <EmptyState title="Your cart is empty" description="Add some products to your cart before checking out."
          action={<Link to="/products" className={buttonClasses("primary", "md")}>Browse products</Link>} />
      </Container>
    );
  }

  if (step === "submitted" && order) {
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <div aria-hidden="true" className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground">Payment submitted</h1>
            <p className="mt-3 text-muted-foreground">Thank you! Your payment has been submitted and is being verified. We will confirm your order shortly.</p>
            <dl className="mt-6 space-y-2 rounded-lg border border-border bg-background p-4 text-left text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Order number</dt><dd className="font-medium text-foreground">{order.order_number}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd className="font-medium text-foreground">Payment Initiated</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Total</dt><dd className="font-medium text-foreground">{formatMoney({ amountMinor: order.total_minor, currency: order.currency })}</dd></div>
            </dl>
            <p className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" aria-hidden="true" />Payment processed securely by Razorpay</p>
            <div className="mt-6"><Link to="/products" className={buttonClasses("primary", "md")}>Continue shopping</Link></div>
          </div>
        </div>
      </Container>
    );
  }

  if (step === "confirm" && order) {
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-2xl font-semibold text-foreground">Complete your payment</h1>
          <p className="mt-2 text-muted-foreground">Your order <strong>{order.order_number}</strong> is ready. Complete payment securely with Razorpay.</p>
          {serverError ? <div className="mt-4"><ErrorState description={serverError} /></div> : null}
          <div className="mt-6 rounded-xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">Order summary</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {order.items.map((item) => (
                <li key={item.product_id} className="flex justify-between">
                  <span className="text-muted-foreground">{item.product_name}</span>
                  <PriceDisplay price={{ amountMinor: item.unit_price_minor, currency: order.currency }} />
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border pt-4">
              <dl className="flex justify-between text-base font-semibold">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="text-foreground">{formatMoney({ amountMinor: order.total_minor, currency: order.currency })}</dd>
              </dl>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">Customer details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Name</dt><dd className="text-foreground">{name.trim()}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd className="text-foreground">{email.trim()}</dd></div>
              {phone.trim() ? <div className="flex justify-between"><dt className="text-muted-foreground">Phone</dt><dd className="text-foreground">{phone.trim()}</dd></div> : null}
            </dl>
          </div>
          {razorpayScript === "error" ? (
            <div className="mt-4"><ErrorState description="Could not load the payment system. Please refresh and try again." /></div>
          ) : (
            <Button type="button" variant="primary" size="lg" loading={submitting} disabled={razorpayScript !== "ready"} onClick={handlePay} className="mt-6 w-full">
              <Lock className="h-4 w-4" aria-hidden="true" />
              {submitting ? "Preparing payment\u2026" : `Pay ${formatMoney({ amountMinor: order.total_minor, currency: order.currency })} securely`}
            </Button>
          )}
          <p className="mt-3 text-center text-xs text-muted-foreground"><Lock className="mr-1 inline h-3 w-3" aria-hidden="true" />Payment processed securely by Razorpay. Your order will be confirmed after payment verification.</p>
          <p className="mt-3 text-center text-xs"><button type="button" onClick={() => setStep("form")} className="text-muted-foreground underline hover:text-foreground">Edit details</button></p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3" noValidate>
        <div className="lg:col-span-2">
          <h1 className="font-display text-2xl font-semibold text-foreground">Checkout</h1>
          <p className="mt-1 text-sm text-muted-foreground">Complete your details to create your order. Payment follows in the next step.</p>
          {serverError ? <div className="mt-4"><ErrorState description={serverError} /></div> : null}
          <fieldset className="mt-6">
            <legend className="font-display text-lg font-semibold text-foreground">Your details</legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <FormField label="Name" required error={errors.name}>
                {(field) => <Input {...field} type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />}
              </FormField>
              <FormField label="Email" required error={errors.email}>
                {(field) => <Input {...field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />}
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Phone" hint="Optional \u2014 for order updates only" error={errors.phone}>
                  {(field) => <Input {...field} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />}
                </FormField>
              </div>
            </div>
          </fieldset>
          <fieldset className="mt-8">
            <legend className="font-display text-lg font-semibold text-foreground">Payment</legend>
            <p className="mt-1 text-sm text-muted-foreground">Payment is completed securely in the next step using Razorpay. Your order is created as <strong>PENDING</strong> until you pay.</p>
          </fieldset>
          <Button type="submit" variant="primary" size="lg" loading={submitting} className="mt-6 w-full">
            {submitting ? "Creating your order\u2026" : "Create order and continue"}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground"><Link to="/cart" className="underline hover:text-foreground">Back to cart</Link></p>
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">Order summary</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {items.map((item) => (
                <li key={item.productId} className="flex justify-between">
                  <span className="text-muted-foreground">{item.name}</span>
                  <PriceDisplay price={{ amountMinor: item.priceMinor, currency: item.currency }} />
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border pt-4">
              <dl className="flex justify-between text-base font-semibold">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="text-foreground">{totalLabel}</dd>
              </dl>
              <p className="mt-1 text-xs text-muted-foreground">Integer minor units (paise). Taxes included.</p>
            </div>
          </div>
        </div>
      </form>
    </Container>
  );
}
