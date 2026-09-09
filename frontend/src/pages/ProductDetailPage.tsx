import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FileText,
  Package,
  PlayCircle,
  ShoppingCart,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { buttonClasses } from "../components/ui/button-styles";
import { Container } from "../components/ui/Container";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PriceDisplay } from "../components/ui/PriceDisplay";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/useToast";
import {
  CatalogApiError,
  fetchCatalogProduct,
  type CatalogMedia,
  type CatalogProductDetail,
} from "../lib/catalog";
import { discountPercent } from "../lib/money";
import { applyPageSeo } from "../lib/seo";

function mediaLabel(media: CatalogMedia): string {
  if (media.media_type === "video") return "Watch preview";
  if (media.media_type === "preview") return "View sample";
  return "Open link";
}

function MediaLink({ media }: { media: CatalogMedia }) {
  const Icon = media.media_type === "video" ? PlayCircle : media.media_type === "preview" ? FileText : ExternalLink;
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary-300 hover:text-primary-700"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {mediaLabel(media)}
    </a>
  );
}

/**
 * Product detail page (Phase 6) — rendered entirely from the public catalog
 * API (`GET /api/products/:slug`, active products only). SEO metadata comes
 * from the product's seo_title/seo_description when the admin supplied them.
 */
export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { notify } = useToast();

  const [product, setProduct] = useState<CatalogProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await fetchCatalogProduct(slug);
      setProduct(data);
      setActiveImageId(null);
    } catch (err) {
      setProduct(null);
      if (err instanceof CatalogApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading this product."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (product) {
      applyPageSeo({
        title: product.seo_title ?? `${product.name} — PlutoReso`,
        description: product.seo_description ?? product.short_description,
      });
    }
  }, [product]);

  if (loading) {
    return (
      <Container className="py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-9 w-40" />
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container className="py-16 sm:py-24">
        <EmptyState
          icon={<Package />}
          title="Product not found"
          description="This product may have been removed or is no longer available. Browse the catalog to find what you need."
          action={
            <Link to="/products" className={buttonClasses("primary", "md")}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Browse all products
            </Link>
          }
        />
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-16 sm:py-24">
        <ErrorState
          title="Could not load this product"
          description={error ?? "Something went wrong while loading this product."}
          onRetry={() => void fetchProduct()}
        />
      </Container>
    );
  }

  const images = product.media.filter((m) => m.media_type === "image");
  const otherMedia = product.media.filter((m) => m.media_type !== "image");
  const activeImage: CatalogMedia | null =
    images.find((m) => m.id === activeImageId) ?? images[0] ?? null;
  const discount =
    product.compare_at_price_minor != null
      ? discountPercent(
          { amountMinor: product.price_minor, currency: product.currency },
          { amountMinor: product.compare_at_price_minor, currency: product.currency }
        )
      : null;

  return (
    <>
      <Container className="py-8 sm:py-12">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All products
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Gallery */}
          <div>
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200">
              {activeImage ? (
                <img
                  src={activeImage.url}
                  alt={activeImage.alt_text ?? product.name}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-14 w-14 text-primary-300" aria-hidden="true" />
              )}
            </div>
            {images.length > 1 ? (
              <div className="mt-3 grid grid-cols-5 gap-2" role="listbox" aria-label="Product images">
                {images.map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    role="option"
                    aria-selected={media.id === activeImage?.id}
                    onClick={() => setActiveImageId(media.id)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      media.id === activeImage?.id
                        ? "border-primary-500"
                        : "border-transparent hover:border-primary-200"
                    }`}
                  >
                    <img
                      src={media.url}
                      alt={media.alt_text ?? `${product.name} image`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
            {otherMedia.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {otherMedia.map((media) => (
                  <MediaLink key={media.id} media={media} />
                ))}
              </div>
            ) : null}
          </div>

          {/* Buy box */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              {product.is_best_seller ? (
                <Badge variant="warning">
                  <Trophy className="mr-1 h-3 w-3" aria-hidden="true" />
                  Best seller
                </Badge>
              ) : null}
              {product.is_featured ? (
                <Badge variant="primary">
                  <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
                  Featured
                </Badge>
              ) : null}
              {discount ? <Badge variant="discount">−{discount}% today</Badge> : null}
            </div>

            {product.category ? (
              <Link
                to={`/products?category=${encodeURIComponent(product.category.slug)}`}
                className="mt-4 inline-flex w-fit rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 transition-colors hover:border-primary-300"
              >
                {product.category.name}
              </Link>
            ) : null}

            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {product.short_description}
            </p>

            <div className="mt-6">
              <PriceDisplay
                price={{ amountMinor: product.price_minor, currency: product.currency }}
                compareAtPrice={
                  product.compare_at_price_minor != null
                    ? {
                        amountMinor: product.compare_at_price_minor,
                        currency: product.currency,
                      }
                    : undefined
                }
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() =>
                  notify(`“${product.name}” — cart & checkout arrive in a later phase.`)
                }
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                Add to cart
              </Button>
              <Link to="/contact" className={buttonClasses("outline", "lg")}>
                Have a question?
              </Link>
            </div>

            {product.benefits.length > 0 ? (
              <ul className="mt-8 space-y-3">
                {product.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-sm leading-6 text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {/* Content sections — rendered only when the admin supplied content */}
        {product.full_description ||
        product.features.length > 0 ||
        product.preview_content ? (
          <div className="mt-14 grid gap-10 border-t border-border pt-10 lg:grid-cols-3">
            {product.full_description ? (
              <section aria-labelledby="description-heading" className="lg:col-span-2">
                <h2
                  id="description-heading"
                  className="font-display text-xl font-semibold text-foreground"
                >
                  About this product
                </h2>
                <p className="mt-4 whitespace-pre-line text-base leading-7 text-muted-foreground">
                  {product.full_description}
                </p>
              </section>
            ) : null}

            {product.features.length > 0 ? (
              <section aria-labelledby="features-heading">
                <h2
                  id="features-heading"
                  className="font-display text-xl font-semibold text-foreground"
                >
                  What's included
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {product.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {product.preview_content ? (
              <section
                aria-labelledby="preview-heading"
                className="rounded-xl border border-border bg-surface p-6 lg:col-span-3"
              >
                <h2
                  id="preview-heading"
                  className="font-display text-xl font-semibold text-foreground"
                >
                  Free preview
                </h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {product.preview_content}
                </p>
              </section>
            ) : null}
          </div>
        ) : null}
      </Container>
    </>
  );
}

