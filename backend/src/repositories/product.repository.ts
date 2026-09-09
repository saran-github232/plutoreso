import { query } from "../db/client.js";
import type {
  ProductRow,
  ProductStatus,
  CategoryId,
} from "../db/types.js";

/**
 * Product data-access layer (Phase 5 / Master Guide §18–§19).
 *
 * All queries are parameterized — never interpolate user input into SQL.
 * Products are soft-lifecycled (active/inactive/archived); no hard deletes.
 */

export interface ListProductsParams {
  status?: ProductStatus;
  categoryId?: string;
  search?: string;
  page: number;
  perPage: number;
  sort?: "name" | "price" | "created" | "updated" | "sort_order";
  order?: "asc" | "desc";
}

export interface ListProductsResult {
  products: ProductRow[];
  total: number;
  page: number;
  perPage: number;
}

const SORT_COLUMN_MAP: Record<string, string> = {
  name: "name",
  price: "price_minor",
  created: "created_at",
  updated: "updated_at",
  sort_order: "sort_order",
};

export async function listProducts(
  params: ListProductsParams
): Promise<ListProductsResult> {
  const { status, categoryId, search, page, perPage, sort, order } = params;
  const conditions: string[] = [];
  const queryParams: unknown[] = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    queryParams.push(status);
  }
  if (categoryId) {
    conditions.push(`category_id = $${paramIndex++}`);
    queryParams.push(categoryId);
  }
  if (search && search.trim()) {
    conditions.push(`(name ILIKE $${paramIndex} OR slug ILIKE $${paramIndex})`);
    queryParams.push(`%${search.trim()}%`);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(
    `SELECT count(*)::text FROM products ${whereClause};`,
    queryParams
  );
  const total = Number(countResult[0]?.count ?? "0");

  const sortColumn = sort ? SORT_COLUMN_MAP[sort] ?? "sort_order" : "sort_order";
  const sortDirection = order === "desc" ? "DESC" : "ASC";
  const limit = perPage;
  const offset = (page - 1) * perPage;

  const products = await query<ProductRow>(
    `SELECT
       id, name, slug, short_description, full_description,
       price_minor, compare_at_price_minor, currency, category_id,
       features, benefits, preview_content, drive_folder_id,
       status, is_featured, is_best_seller, sort_order,
       seo_title, seo_description, created_at, updated_at
     FROM products
     ${whereClause}
     ORDER BY ${sortColumn} ${sortDirection}, created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++};`,
    [...queryParams, limit, offset]
  );

  return { products, total, page, perPage };
}

export async function getProductById(
  id: string
): Promise<ProductRow | null> {
  const rows = await query<ProductRow>(
    `SELECT
       id, name, slug, short_description, full_description,
       price_minor, compare_at_price_minor, currency, category_id,
       features, benefits, preview_content, drive_folder_id,
       status, is_featured, is_best_seller, sort_order,
       seo_title, seo_description, created_at, updated_at
     FROM products
     WHERE id = $1
     LIMIT 1;`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getProductBySlug(
  slug: string
): Promise<ProductRow | null> {
  const rows = await query<ProductRow>(
    `SELECT id, name, slug FROM products WHERE slug = $1 LIMIT 1;`,
    [slug]
  );
  return rows[0] ?? null;
}


export interface CreateProductData {
  name: string;
  slug: string;
  short_description: string;
  full_description: string | null;
  price_minor: number;
  compare_at_price_minor: number | null;
  currency: string;
  category_id: CategoryId | null;
  features: unknown[];
  benefits: unknown[];
  preview_content: string | null;
  drive_folder_id: string | null;
  status: ProductStatus;
  is_featured: boolean;
  is_best_seller: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
}

export async function createProduct(
  data: CreateProductData
): Promise<ProductRow> {
  const rows = await query<ProductRow>(
    `INSERT INTO products
       (name, slug, short_description, full_description,
        price_minor, compare_at_price_minor, currency, category_id,
        features, benefits, preview_content, drive_folder_id,
        status, is_featured, is_best_seller, sort_order,
        seo_title, seo_description)
     VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb,
        $11, $12, $13, $14, $15, $16, $17, $18)
     RETURNING
       id, name, slug, short_description, full_description,
       price_minor, compare_at_price_minor, currency, category_id,
       features, benefits, preview_content, drive_folder_id,
       status, is_featured, is_best_seller, sort_order,
       seo_title, seo_description, created_at, updated_at;`,
    [
      data.name,
      data.slug,
      data.short_description,
      data.full_description,
      data.price_minor,
      data.compare_at_price_minor,
      data.currency,
      data.category_id,
      JSON.stringify(data.features),
      JSON.stringify(data.benefits),
      data.preview_content,
      data.drive_folder_id,
      data.status,
      data.is_featured,
      data.is_best_seller,
      data.sort_order,
      data.seo_title,
      data.seo_description,
    ]
  );
  const row = rows[0];
  if (!row) throw new Error("Failed to create product.");
  return row;
}

export async function updateProduct(
  id: string,
  data: Partial<CreateProductData>
): Promise<ProductRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const addField = (column: string, value: unknown) => {
    fields.push(`${column} = $${paramIndex++}`);
    values.push(value);
  };

  if (data.name !== undefined) addField("name", data.name);
  if (data.slug !== undefined) addField("slug", data.slug);
  if (data.short_description !== undefined)
    addField("short_description", data.short_description);
  if (data.full_description !== undefined)
    addField("full_description", data.full_description);
  if (data.price_minor !== undefined) addField("price_minor", data.price_minor);
  if (data.compare_at_price_minor !== undefined)
    addField("compare_at_price_minor", data.compare_at_price_minor);
  if (data.currency !== undefined) addField("currency", data.currency);
  if (data.category_id !== undefined) addField("category_id", data.category_id);
  if (data.features !== undefined) {
    addField("features", JSON.stringify(data.features));
  }
  if (data.benefits !== undefined) {
    addField("benefits", JSON.stringify(data.benefits));
  }
  if (data.preview_content !== undefined)
    addField("preview_content", data.preview_content);
  if (data.drive_folder_id !== undefined)
    addField("drive_folder_id", data.drive_folder_id);
  if (data.status !== undefined) addField("status", data.status);
  if (data.is_featured !== undefined) addField("is_featured", data.is_featured);
  if (data.is_best_seller !== undefined)
    addField("is_best_seller", data.is_best_seller);
  if (data.sort_order !== undefined) addField("sort_order", data.sort_order);
  if (data.seo_title !== undefined) addField("seo_title", data.seo_title);
  if (data.seo_description !== undefined)
    addField("seo_description", data.seo_description);

  if (fields.length === 0) {
    return getProductById(id);
  }

  values.push(id);
  const rows = await query<ProductRow>(
    `UPDATE products
     SET ${fields.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING
       id, name, slug, short_description, full_description,
       price_minor, compare_at_price_minor, currency, category_id,
       features, benefits, preview_content, drive_folder_id,
       status, is_featured, is_best_seller, sort_order,
       seo_title, seo_description, created_at, updated_at;`,
    values
  );
  return rows[0] ?? null;
}

export async function updateProductStatus(
  id: string,
  status: ProductStatus
): Promise<ProductRow | null> {
  const rows = await query<ProductRow>(
    `UPDATE products
     SET status = $1
     WHERE id = $2
     RETURNING
       id, name, slug, short_description, full_description,
       price_minor, compare_at_price_minor, currency, category_id,
       features, benefits, preview_content, drive_folder_id,
       status, is_featured, is_best_seller, sort_order,
       seo_title, seo_description, created_at, updated_at;`,
    [status, id]
  );
  return rows[0] ?? null;
}

export async function archiveProduct(
  id: string
): Promise<ProductRow | null> {
  return updateProductStatus(id, "archived");
}

export async function isSlugTaken(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const rows = await query<{ count: string }>(
    `SELECT count(*)::text FROM products
     WHERE slug = $1 ${excludeId ? "AND id != $2" : ""};`,
    excludeId ? [slug, excludeId] : [slug]
  );
  return Number(rows[0]?.count ?? "0") > 0;
}

export async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  for (let attempt = 0; attempt < 100; attempt++) {
    const taken = await isSlugTaken(candidate);
    if (!taken) return candidate;
    candidate = `${baseSlug}-${attempt + 2}`;
  }
  return `${baseSlug}-${Date.now()}`;
}
