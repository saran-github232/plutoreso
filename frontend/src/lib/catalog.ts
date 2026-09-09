import { API_BASE_URL } from "./api";
import type { Money } from "./money";
import type { Product } from "../types/product";

/**
 * Public storefront catalog client (Phase 6).
 *
 * Reads the public catalog API (no auth): GET /api/products,
 * GET /api/products/:slug, GET /api/categories. Only PUBLIC configuration
 * is used — never secrets. Responses are customer-safe DTOs; the server
 * never exposes drive_folder_id, sessions, or admin metadata.
 */

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface CatalogMedia {
  id: string;
  media_type: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface CatalogProductCard {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  price_minor: number;
  compare_at_price_minor: number | null;
  currency: string;
  category: CatalogCategory | null;
  primary_image: CatalogMedia | null;
  is_featured: boolean;
  is_best_seller: boolean;
}

export interface CatalogProductDetail extends CatalogProductCard {
  full_description: string | null;
  features: string[];
  benefits: string[];
  preview_content: string | null;
  media: CatalogMedia[];
  seo_title: string | null;
  seo_description: string | null;
}

export interface CatalogPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export type CatalogSort = "newest" | "price-asc" | "price-desc" | "name";

export interface CatalogQuery {
  page?: number;
  perPage?: number;
  category?: string;
  search?: string;
  sort?: CatalogSort;
  featured?: boolean;
  bestSeller?: boolean;
}

/** Typed error for catalog fetch failures (safe messages only). */
export class CatalogApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "CatalogApiError";
    this.status = status;
  }
}

function buildQuery(params: CatalogQuery): string {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.perPage) search.set("perPage", String(params.perPage));
  if (params.category) search.set("category", params.category);
  if (params.search) search.set("search", params.search);
  if (params.sort) search.set("sort", params.sort);
  if (params.featured !== undefined) search.set("featured", String(params.featured));
  if (params.bestSeller !== undefined) search.set("bestSeller", String(params.bestSeller));
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new CatalogApiError(0, "The store is unreachable. Check your connection and try again.");
  }

  if (response.status === 404) {
    throw new CatalogApiError(404, "The requested product could not be found.");
  }
  if (response.status === 503) {
    throw new CatalogApiError(503, "The catalog is temporarily unavailable. Please try again shortly.");
  }
  if (!response.ok) {
    throw new CatalogApiError(response.status, "Something went wrong while loading the catalog.");
  }

  return (await response.json()) as T;
}

export interface CatalogListResponse {
  products: CatalogProductCard[];
  pagination: CatalogPagination;
}

/** Live product listing (active products only, server-enforced). */
export function fetchCatalogProducts(
  params: CatalogQuery = {},
  signal?: AbortSignal
): Promise<CatalogListResponse> {
  return request<CatalogListResponse>(`/api/products${buildQuery(params)}`, signal);
}

/** Live product detail by slug (active products only; 404 when not public). */
export async function fetchCatalogProduct(
  slug: string,
  signal?: AbortSignal
): Promise<CatalogProductDetail> {
  const data = await request<{ product: CatalogProductDetail }>(
    `/api/products/${encodeURIComponent(slug)}`,
    signal
  );
  return data.product;
}

/** Live active categories for storefront filtering. */
export async function fetchCatalogCategories(signal?: AbortSignal): Promise<CatalogCategory[]> {
  const data = await request<{ categories: CatalogCategory[] }>(`/api/categories`, signal);
  return data.categories;
}

/** Projects a catalog card DTO onto the storefront Product model. */
export function toStorefrontProduct(card: CatalogProductCard): Product {
  const price: Money = { amountMinor: card.price_minor, currency: card.currency };
  const compareAtPrice: Money | undefined =
    card.compare_at_price_minor != null
      ? { amountMinor: card.compare_at_price_minor, currency: card.currency }
      : undefined;
  return {
    id: card.id,
    slug: card.slug,
    name: card.name,
    shortDescription: card.short_description,
    price,
    ...(compareAtPrice ? { compareAtPrice } : {}),
    benefits: [],
    ...(card.category ? { category: card.category.name } : {}),
    ...(card.primary_image
      ? { imageUrl: card.primary_image.url, imageAlt: card.primary_image.alt_text ?? card.name }
      : {}),
    isFeatured: card.is_featured,
    isBestSeller: card.is_best_seller,
  };
}
