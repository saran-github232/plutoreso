import { useEffect, useState } from "react";
import { BundlesTeaser } from "../components/home/BundlesTeaser";
import { FaqPreview } from "../components/home/FaqPreview";
import { Hero } from "../components/home/Hero";
import { ProductShowcaseSection } from "../components/home/ProductShowcaseSection";
import { SocialProofPlaceholder } from "../components/home/SocialProofPlaceholder";
import { ValueProps } from "../components/home/ValueProps";
import { WhyPlutoReso } from "../components/home/WhyPlutoReso";
import { WhatsAppCta } from "../components/WhatsAppCta";
import {
  fetchCatalogProducts,
  toStorefrontProduct,
  type CatalogProductCard,
} from "../lib/catalog";
import { applyPageSeo } from "../lib/seo";
import type { Product } from "../types/product";

const SHOWCASE_SIZE = 4;

/** Live showcase rows from the public catalog API; sections hide on failure. */
interface ShowcaseState {
  products: Product[];
  loading: boolean;
  failed: boolean;
}

const IDLE: ShowcaseState = { products: [], loading: true, failed: false };

/**
 * Homepage (Master Guide §7 structure) — featured/best-seller rows are served
 * by the public catalog API (Phase 6). Sections render skeletons while the
 * API responds and hide themselves when a row is empty or unreachable, so the
 * homepage stays useful with no products (e.g. before the owner adds any).
 */
export function HomePage() {
  const [featured, setFeatured] = useState<ShowcaseState>(IDLE);
  const [bestSellers, setBestSellers] = useState<ShowcaseState>(IDLE);

  useEffect(() => {
    // Restore site-default SEO when the homepage mounts.
    applyPageSeo();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load(
      params: { featured?: boolean; bestSeller?: boolean },
      setState: (state: ShowcaseState) => void
    ) {
      try {
        const result = await fetchCatalogProducts(
          { ...params, perPage: SHOWCASE_SIZE },
          controller.signal
        );
        if (!cancelled) {
          setState({
            products: result.products.map(
              (card: CatalogProductCard) => toStorefrontProduct(card)
            ),
            loading: false,
            failed: false,
          });
        }
      } catch (err) {
        if (!cancelled && (err as Error).name !== "AbortError") {
          setState({ products: [], loading: false, failed: true });
        }
      }
    }

    void load({ featured: true }, setFeatured);
    void load({ bestSeller: true }, setBestSellers);

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <>
      <Hero />
      <ValueProps />
      {!featured.failed ? (
        <ProductShowcaseSection
          id="featured"
          tone="surface"
          eyebrow="Featured"
          title="Featured products"
          description="Hand-picked by the PlutoReso team — instant delivery, lifetime access."
          loading={featured.loading}
          products={featured.products}
        />
      ) : null}
      {!bestSellers.failed ? (
        <ProductShowcaseSection
          id="best-sellers"
          eyebrow="Popular"
          title="Best sellers"
          loading={bestSellers.loading}
          products={bestSellers.products}
        />
      ) : null}
      <BundlesTeaser />
      <WhyPlutoReso />
      <SocialProofPlaceholder />
      <FaqPreview />
      <WhatsAppCta />
    </>
  );
}

