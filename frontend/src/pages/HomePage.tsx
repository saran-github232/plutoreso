import { BundlesTeaser } from "../components/home/BundlesTeaser";
import { FaqPreview } from "../components/home/FaqPreview";
import { Hero } from "../components/home/Hero";
import { ProductShowcaseSection } from "../components/home/ProductShowcaseSection";
import { SocialProofPlaceholder } from "../components/home/SocialProofPlaceholder";
import { ValueProps } from "../components/home/ValueProps";
import { WhyPlutoReso } from "../components/home/WhyPlutoReso";
import { WhatsAppCta } from "../components/WhatsAppCta";
import { MOCK_BEST_SELLERS, MOCK_FEATURED } from "../data/mock-products";

/**
 * Homepage foundation (Master Guide §7 structure).
 * Uses clearly-marked sample data only; real content arrives via the
 * Admin Panel and backend in later phases.
 */
export function HomePage() {
  return (
    <>
      <Hero />
      <ValueProps />
      <ProductShowcaseSection
        id="featured"
        tone="surface"
        eyebrow="Featured"
        title="Featured products"
        note="Sample products shown for design preview — the real catalog arrives with the storefront phases."
        products={MOCK_FEATURED}
      />
      <ProductShowcaseSection
        id="best-sellers"
        eyebrow="Popular"
        title="Best sellers"
        products={MOCK_BEST_SELLERS}
      />
      <BundlesTeaser />
      <WhyPlutoReso />
      <SocialProofPlaceholder />
      <FaqPreview />
      <WhatsAppCta />
    </>
  );
}
