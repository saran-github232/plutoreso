/**
 * Currency formatting for PlutoReso.
 *
 * Amounts are stored as integer minor units (paise for INR) — the same
 * convention Razorpay uses — so floating-point math never touches money.
 * Currency handling is centralized here so future international support
 * requires changes only in this file, not in UI components.
 */
export interface Money {
  /** Amount in minor units (e.g. paise for INR: 49900 = ₹499). */
  amountMinor: number;
  /** ISO 4217 currency code, e.g. "INR". */
  currency: string;
}

const localeForCurrency: Record<string, string> = {
  INR: "en-IN",
};

/** Formats a Money value, e.g. 49900 INR → "₹499". */
export function formatMoney({ amountMinor, currency }: Money): string {
  return new Intl.NumberFormat(localeForCurrency[currency] ?? "en", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amountMinor / 100);
}

/** Percentage off between price and compare-at price, or null when n/a. */
export function discountPercent(price: Money, compareAt: Money): number | null {
  if (price.currency !== compareAt.currency) {
    return null;
  }
  if (compareAt.amountMinor <= price.amountMinor) {
    return null;
  }
  const percent = Math.round(
    ((compareAt.amountMinor - price.amountMinor) / compareAt.amountMinor) * 100
  );
  return percent > 0 ? percent : null;
}
