import { query } from "../db/client.js";
import type { ProductMediaRow } from "../db/types.js";

/**
 * Product media data-access layer (Phase 5 / Master Guide §18).
 *
 * Media are URL records — no binary uploads in Phase 5.
 */

export async function listMediaForProduct(
  productId: string
): Promise<ProductMediaRow[]> {
  const rows = await query<ProductMediaRow>(
    `SELECT id, product_id, media_type, url, alt_text, sort_order, created_at
     FROM product_media
     WHERE product_id = $1
     ORDER BY sort_order ASC, created_at ASC;`,
    [productId]
  );
  return rows;
}

export async function getMediaById(
  mediaId: string
): Promise<ProductMediaRow | null> {
  const rows = await query<ProductMediaRow>(
    `SELECT id, product_id, media_type, url, alt_text, sort_order, created_at
     FROM product_media
     WHERE id = $1
     LIMIT 1;`,
    [mediaId]
  );
  return rows[0] ?? null;
}

export async function createMedia(data: {
  product_id: string;
  media_type: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}): Promise<ProductMediaRow> {
  const rows = await query<ProductMediaRow>(
    `INSERT INTO product_media (product_id, media_type, url, alt_text, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, product_id, media_type, url, alt_text, sort_order, created_at;`,
    [data.product_id, data.media_type, data.url, data.alt_text, data.sort_order]
  );
  const row = rows[0];
  if (!row) throw new Error("Failed to create media.");
  return row;
}

export async function updateMedia(
  mediaId: string,
  data: Partial<{
    media_type: string;
    url: string;
    alt_text: string | null;
    sort_order: number;
  }>
): Promise<ProductMediaRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const addField = (column: string, value: unknown) => {
    fields.push(`${column} = $${paramIndex++}`);
    values.push(value);
  };

  if (data.media_type !== undefined) addField("media_type", data.media_type);
  if (data.url !== undefined) addField("url", data.url);
  if (data.alt_text !== undefined) addField("alt_text", data.alt_text);
  if (data.sort_order !== undefined) addField("sort_order", data.sort_order);

  if (fields.length === 0) {
    return getMediaById(mediaId);
  }

  values.push(mediaId);
  const rows = await query<ProductMediaRow>(
    `UPDATE product_media
     SET ${fields.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING id, product_id, media_type, url, alt_text, sort_order, created_at;`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteMedia(mediaId: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `DELETE FROM product_media WHERE id = $1 RETURNING id;`,
    [mediaId]
  );
  return rows.length > 0;
}
