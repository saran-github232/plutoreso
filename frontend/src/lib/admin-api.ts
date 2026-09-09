/**
 * Admin API client (Phase 5 / Master Guide §18–§19).
 *
 * All admin catalog operations go through the backend — never directly to
 * the database. Uses credentials: include for session cookie auth.
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:4000"
).replace(/\/+$/, "");

export class AdminApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.details = details;
  }
}

async function adminFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/api/admin${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ?? `Request failed (HTTP ${response.status})`;
    throw new AdminApiError(response.status, message, data?.error?.details);
  }

  return data as T;
}

// --- Types ---

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  full_description: string | null;
  price_minor: number;
  compare_at_price_minor: number | null;
  currency: string;
  category_id: string | null;
  features: string[];
  benefits: string[];
  preview_content: string | null;
  drive_folder_id: string | null;
  status: "active" | "inactive" | "archived";
  is_featured: boolean;
  is_best_seller: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  media_type: "image" | "video" | "preview";
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  products: Product[];
  pagination: Pagination;
}

export interface ListProductsParams {
  page?: number;
  perPage?: number;
  status?: "active" | "inactive" | "archived";
  categoryId?: string;
  search?: string;
  sort?: "name" | "price" | "created" | "updated" | "sort_order";
  order?: "asc" | "desc";
}

export async function listProducts(
  params: ListProductsParams = {}
): Promise<ProductListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.perPage) query.set("perPage", String(params.perPage));
  if (params.status) query.set("status", params.status);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.search) query.set("search", params.search);
  if (params.sort) query.set("sort", params.sort);
  if (params.order) query.set("order", params.order);

  const qs = query.toString();
  return adminFetch<ProductListResponse>(`/products${qs ? `?${qs}` : ""}`);
}

export async function getProduct(id: string): Promise<{ product: Product }> {
  return adminFetch<{ product: Product }>(`/products/${id}`);
}

export async function createProduct(
  data: CreateProductInput
): Promise<{ product: Product }> {
  return adminFetch<{ product: Product }>("/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduct(
  id: string,
  data: Partial<CreateProductInput>
): Promise<{ product: Product }> {
  return adminFetch<{ product: Product }>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateProductStatus(
  id: string,
  status: "active" | "inactive" | "archived"
): Promise<{ product: Product }> {
  return adminFetch<{ product: Product }>(`/products/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteProduct(
  id: string
): Promise<{ product: Product }> {
  return adminFetch<{ product: Product }>(`/products/${id}`, {
    method: "DELETE",
  });
}

// --- Category API calls ---

export async function listCategories(): Promise<{ categories: Category[] }> {
  return adminFetch<{ categories: Category[] }>("/categories");
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export async function createCategory(
  data: CreateCategoryInput
): Promise<{ category: Category }> {
  return adminFetch<{ category: Category }>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: string,
  data: Partial<CreateCategoryInput>
): Promise<{ category: Category }> {
  return adminFetch<{ category: Category }>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// --- Media API calls ---

export async function listMedia(
  productId: string
): Promise<{ media: ProductMedia[] }> {
  return adminFetch<{ media: ProductMedia[] }>(`/products/${productId}/media`);
}

export interface CreateMediaInput {
  media_type: "image" | "video" | "preview";
  url: string;
  alt_text?: string | null;
  sort_order?: number;
}

export async function createMedia(
  productId: string,
  data: CreateMediaInput
): Promise<{ media: ProductMedia }> {
  return adminFetch<{ media: ProductMedia }>(`/products/${productId}/media`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMedia(
  productId: string,
  mediaId: string,
  data: Partial<CreateMediaInput>
): Promise<{ media: ProductMedia }> {
  return adminFetch<{ media: ProductMedia }>(
    `/products/${productId}/media/${mediaId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function deleteMedia(
  productId: string,
  mediaId: string
): Promise<void> {
  await adminFetch<void>(`/products/${productId}/media/${mediaId}`, {
    method: "DELETE",
  });
}


export interface CreateProductInput {
  name: string;
  slug: string;
  short_description: string;
  full_description?: string | null;
  price_minor: number;
  compare_at_price_minor?: number | null;
  currency?: string;
  category_id?: string | null;
  features?: string[];
  benefits?: string[];
  preview_content?: string | null;
  drive_folder_url?: string | null;
  is_featured?: boolean;
  is_best_seller?: boolean;
  sort_order?: number;
  seo_title?: string | null;
  seo_description?: string | null;
}
