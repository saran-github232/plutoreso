import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { ProductGrid } from "../components/ui/ProductGrid";
import { Select } from "../components/ui/Select";
import { useToast } from "../components/ui/useToast";
import {
  fetchCatalogCategories,
  fetchCatalogProducts,
  toStorefrontProduct,
  type CatalogSort,
} from "../lib/catalog";
import { applyPageSeo } from "../lib/seo";
import type { Product } from "../types/product";

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

const PER_PAGE = 12;

function isCatalogSort(value: string): value is CatalogSort {
  return SORT_OPTIONS.some((option) => option.value === value);
}

/**
 * Storefront catalog page (Phase 6) — served entirely by the public catalog
 * API (`GET /api/products`). Active products only, server-enforced. Filters
 * (category/search/sort/page) live in the URL so results are shareable.
 */
export function ProductsPage() {
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: PER_PAGE, total: 0, totalPages: 0 });
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const category = searchParams.get("category") ?? "";
  const search = searchParams.get("search") ?? "";
  const sortParam = searchParams.get("sort") ?? "newest";
  const sort: CatalogSort = isCatalogSort(sortParam) ? sortParam : "newest";
  const hasFilters = Boolean(category || search || sort !== "newest");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCatalogProducts({
        page,
        perPage: PER_PAGE,
        category: category || undefined,
        search: search || undefined,
        sort,
      });
      setProducts(result.products.map(toStorefrontProduct));
      setPagination(result.pagination);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the catalog."
      );
    } finally {
      setLoading(false);
    }
  }, [page, category, search, sort]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    applyPageSeo({
      title: "All products — PlutoReso",
      description:
        "Browse the full PlutoReso catalog of premium digital products — instant delivery, lifetime access.",
    });
  }, []);

  // Categories power the filter; a failure here is non-fatal (filter hides).
  useEffect(() => {
    let cancelled = false;
    fetchCatalogCategories()
      .then((rows) => {
        if (!cancelled) setCategories(rows.map((c) => ({ slug: c.slug, name: c.name })));
      })
      .catch(() => {
        /* non-fatal: category filter simply stays empty */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    updateParam("search", searchInput.trim());
  }

  function clearFilters() {
    setSearchParams({});
    setSearchInput("");
  }

  function goToPage(nextPage: number) {
    const bounded = Math.min(Math.max(1, nextPage), Math.max(1, pagination.totalPages));
    updateParam("page", String(bounded));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <section aria-labelledby="products-heading" className="border-b border-border bg-surface">
        <Container className="py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Catalog</p>
          <h1
            id="products-heading"
            className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            All products
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Premium digital products with instant delivery. Every purchase is delivered to your
            Google Drive — access stays yours forever.
          </p>
        </Container>
      </section>

      <Container className="py-8 sm:py-10">
        {/* Filters: search + category + sort — URL state, so results are shareable */}
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2" role="search">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search products…"
                aria-label="Search products"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
          <div className="grid grid-cols-2 gap-3 lg:w-96">
            <Select
              value={category}
              onChange={(event) => updateParam("category", event.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select
              value={sort}
              onChange={(event) => updateParam("sort", event.target.value)}
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {error ? (
          <ErrorState
            title="Could not load the catalog"
            description={error}
            onRetry={() => void fetchProducts()}
          />
        ) : loading ? (
          <ProductGrid loading skeletonCount={8} />
        ) : products.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No products match your filters" : "No products yet"}
            description={
              hasFilters
                ? "Try a different search term or category, or clear the filters to see everything."
                : "The catalog is being prepared. Please check back soon."
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="mb-5 text-sm text-muted-foreground" aria-live="polite">
              Showing {products.length} of {pagination.total} product
              {pagination.total === 1 ? "" : "s"}
              {category
                ? ` in “${categories.find((c) => c.slug === category)?.name ?? category}”`
                : ""}
              {search ? ` matching “${search}”` : ""}
            </p>
            <ProductGrid
              products={products}
              onAddToCart={(product) =>
                notify(`“${product.name}” — cart & checkout arrive in a later phase.`)
              }
            />
            {pagination.totalPages > 1 ? (
              <nav
                aria-label="Catalog pages"
                className="mt-10 flex items-center justify-center gap-3"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </nav>
            ) : null}
          </>
        )}

        <p className="mt-12 text-center text-xs text-subtle-foreground">
          Looking for something specific?{" "}
          <Link to="/contact" className="underline hover:text-foreground">
            Contact us
          </Link>{" "}
          and we will help you choose.
        </p>
      </Container>
    </>
  );
}
