import { query } from "../db/client.js";
import type { CategoryRow } from "../db/types.js";

/**
 * Category data-access layer (Phase 5 / Master Guide §17).
 */

export async function listCategories(): Promise<CategoryRow[]> {
  const rows = await query<CategoryRow>(
    `SELECT id, name, slug, description, is_active, sort_order,
            created_at, updated_at
     FROM categories
     ORDER BY sort_order ASC, name ASC;`
  );
  return rows;
}

export async function getCategoryById(
  id: string
): Promise<CategoryRow | null> {
  const rows = await query<CategoryRow>(
    `SELECT id, name, slug, description, is_active, sort_order,
            created_at, updated_at
     FROM categories
     WHERE id = $1
     LIMIT 1;`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getCategoryBySlug(
  slug: string
): Promise<CategoryRow | null> {
  const rows = await query<CategoryRow>(
    `SELECT id, name, slug FROM categories WHERE slug = $1 LIMIT 1;`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function isCategorySlugTaken(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const rows = await query<{ count: string }>(
    `SELECT count(*)::text FROM categories
     WHERE slug = $1 ${excludeId ? "AND id != $2" : ""};`,
    excludeId ? [slug, excludeId] : [slug]
  );
  return Number(rows[0]?.count ?? "0") > 0;
}

export async function generateUniqueCategorySlug(
  baseSlug: string
): Promise<string> {
  let candidate = baseSlug;
  for (let attempt = 0; attempt < 100; attempt++) {
    const taken = await isCategorySlugTaken(candidate);
    if (!taken) return candidate;
    candidate = `${baseSlug}-${attempt + 2}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}): Promise<CategoryRow> {
  const rows = await query<CategoryRow>(
    `INSERT INTO categories (name, slug, description, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, slug, description, is_active, sort_order,
               created_at, updated_at;`,
    [data.name, data.slug, data.description, data.is_active, data.sort_order]
  );
  const row = rows[0];
  if (!row) throw new Error("Failed to create category.");
  return row;
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
  }>
): Promise<CategoryRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const addField = (column: string, value: unknown) => {
    fields.push(`${column} = $${paramIndex++}`);
    values.push(value);
  };

  if (data.name !== undefined) addField("name", data.name);
  if (data.slug !== undefined) addField("slug", data.slug);
  if (data.description !== undefined) addField("description", data.description);
  if (data.is_active !== undefined) addField("is_active", data.is_active);
  if (data.sort_order !== undefined) addField("sort_order", data.sort_order);

  if (fields.length === 0) {
    return getCategoryById(id);
  }

  values.push(id);
  const rows = await query<CategoryRow>(
    `UPDATE categories
     SET ${fields.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING id, name, slug, description, is_active, sort_order,
               created_at, updated_at;`,
    values
  );
  return rows[0] ?? null;
}
