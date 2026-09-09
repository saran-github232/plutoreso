import { query } from "../db/client.js";
import type { CategoryRow, ProductMediaRow, ProductRow } from "../db/types.js";

/**
 * Public storefront catalog data-access (Phase 6).
 *
 * HARD RULES:
 * - Only `status = 'active'` products are ever returned.
 * - `drive_folder_id` is NEVER selected — it stays server-only.
 * - All user input is bound as parameters; sort/order map through a whitelist
 *   (never interpolated).
 */

export interface CatalogListParams {
  page: number;
  perPage: number;
  /** Category slug (public identifier) — resolved to id server-side. */
  categorySlug?: string;
  search?: string;
  sort: "newest" | "price-asc" | "price-desc" | "name";
  featured?: boolean;
  bestSeller?: boolean;
}

export interface CatalogListResult {
  products: ProductRow[];
  total: number;
  page: number;
  perPage: number;
}

/** Columns safe for public exposure — explicitly excludes drive_folder_id. */
const PUBLIC_PRODUCT_COLUMNS = `id, name, slug, short_description, full_description,
  price_minor, compare_at_price_minor, currency, category_id,
  features, benefits, preview_content,
  status, is_featured, is_best_seller, sort_order,
  seo_title, seo_description, created_at, updated_at`;

const SORT_MAP: Record<CatalogListParams["sort"], string> = {
  newest: "created_at DESC, sort_order ASC",
  "price-asc": "price_minor ASC, sort_order ASC",
  "price-desc": "price_minor DESC, sort_order ASC",
  name: "name ASC, sort_order ASC",
};

async function resolveCategoryId(slug: string): Promise<string | null> {
  const rows = await query<CategoryRow>(
    `SELECT id FROM categories WHERE slug = $1 AND is_active = true LIMIT 1;`,
    [slug]
  );
  return rows[0]?.id ?? null;
}

export async function listActiveProducts(
  params: CatalogListParams
): Promise<CatalogListResult> {
  const conditions: string[] = [`status = 'active'`];
  const values: unknown[] = [];
  let idx = 1;

  if (params.categorySlug) {
    const categoryId = await resolveCategoryId(params.categorySlug);
    if (!categoryId) {
      return { products: [], total: 0, page: params.page, perPage: params.perPage };
    }
    conditions.push(`category_id = $${idx++}`);
    values.push(categoryId);
  }
  if (params.search && params.search.trim()) {
    conditions.push(`(name ILIKE $${idx} OR slug ILIKE $${idx})`);
    values.push(`%${params.search.trim()}%`);
    idx++;
  }
  if (params.featured !== undefined) {
    conditions.push(`is_featured = $${idx++}`);
    values.push(params.featured);
  }
  if (params.bestSeller !== undefined) {
    conditions.push(`is_best_seller = $${idx++}`);
    values.push(params.bestSeller);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const countRows = await query<{ count: string }>(
    `SELECT count(*)::text FROM products ${where};`,
    values
  );
  const total = Number(countRows[0]?.count ?? "0");

  const orderBy = SORT_MAP[params.sort] ?? SORT_MAP.newest;
  const limit = params.perPage;
  const offset = (params.page - 1) * params.perPage;

  const products = await query<ProductRow>(
    `SELECT ${PUBLIC_PRODUCT_COLUMNS}
     FROM products
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${idx++} OFFSET $${idx++};`,
    [...values, limit, offset]
  );

  return { products, total, page: params.page, perPage: params.perPage };
}

export async function getActiveProductBySlug(slug: string): Promise<ProductRow | null> {
  const rows = await query<ProductRow>(
    `SELECT ${PUBLIC_PRODUCT_COLUMNS}
     FROM products
     WHERE slug = $1 AND status = 'active'
     LIMIT 1;`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function listActiveCategories(): Promise<CategoryRow[]> {
  return query<CategoryRow>(
    `SELECT id, name, slug, description, is_active, sort_order, created_at, updated_at
     FROM categories
     WHERE is_active = true
     ORDER BY sort_order ASC, name ASC;`
  );
}

export async function listPublicMediaForProduct(
  productId: string
): Promise<ProductMediaRow[]> {
  return query<ProductMediaRow>(
    `SELECT id, product_id, media_type, url, alt_text, sort_order, created_at
     FROM product_media
     WHERE product_id = $1
     ORDER BY sort_order ASC, created_at ASC;`,
    [productId]
  );
}
