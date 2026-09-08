/**
 * Public site configuration (Phase 2).
 * Only PUBLIC values may live here or in VITE_* env variables —
 * private configuration and secrets are backend-only (Master Guide §34).
 */

export interface NavLinkItem {
  label: string;
  href: string;
}

export const siteConfig = {
  name: "PlutoReso",
  tagline: "Premium digital products, delivered instantly.",
  description:
    "PlutoReso is a digital-products store for India — browse, pay securely and access purchases digitally.",
  /**
   * Support WhatsApp number in international format WITHOUT "+" (e.g. "91XXXXXXXXXX").
   * Empty until the business supplies it — never hardcode a real number here.
   */
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER?.trim() ?? "",
  whatsappPrefillMessage: "Hi PlutoReso, I have a question about a digital product.",
  nav: [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" }
  ] satisfies NavLinkItem[],
  footer: {
    shop: [
      { label: "All products", href: "/products" },
      { label: "Cart", href: "/cart" }
    ] satisfies NavLinkItem[],
    company: [
      { label: "About", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" }
    ] satisfies NavLinkItem[],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Refund & Cancellation", href: "/refund-policy" },
      { label: "Digital Delivery", href: "/delivery-policy" }
    ] satisfies NavLinkItem[]
  }
} as const;

/** Builds a wa.me link, or null when no support number is configured yet. */
export function whatsappHref(number: string, message: string): string | null {
  if (!number) {
    return null;
  }
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
