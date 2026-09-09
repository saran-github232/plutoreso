import { z } from "zod";

/**
 * Product validation schemas (Phase 5 / Master Guide §18–§19).
 *
 * All admin product mutations are validated here before reaching the
 * repository layer. Money is accepted in minor units (paise) at the API
 * boundary — the frontend converts rupees → paise before sending.
 */

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CURRENCY_REGEX = /^[A-Z]{3}$/;

/** Accept a Google Drive folder URL and extract the folder ID. */
const DRIVE_FOLDER_URL_REGEX =
  /^https?:\/\/(?:drive|docs)\.google\.com\/(?:drive\/folders\/|folders\/|open\?id=)([a-zA-Z0-9_-]+)/;

/**
 * Extract a Google Drive folder ID from a URL, or null if invalid.
 * Exported for reuse and unit testing.
 */
export function extractDriveFolderId(
  url: string | null | undefined
): { folderId: string | null; valid: boolean } {
  if (!url || url.trim() === "") {
    return { folderId: null, valid: true };
  }
  const match = url.trim().match(DRIVE_FOLDER_URL_REGEX);
  if (!match) {
    return { folderId: null, valid: false };
  }
  return { folderId: match[1] ?? null, valid: true };
}

/** JSON array of strings (features/benefits). */
const stringArraySchema = z
  .array(z.string().trim().min(1).max(500))
  .max(50);

/** Shared product fields for create/update. */
const productBaseSchema = {
  name: z.string().trim().min(1, "Name is required.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(200)
    .regex(SLUG_REGEX, "Slug must be lowercase letters, numbers, and hyphens only."),
  short_description: z
    .string()
    .trim()
    .min(1, "Short description is required.")
    .max(500),
  full_description: z.string().trim().max(10_000).optional().nullable(),
  price_minor: z
    .number()
    .int("Price must be a whole number.")
    .min(0, "Price cannot be negative.")
    .max(10_000_000_00, "Price is too large."),
  compare_at_price_minor: z
    .number()
    .int("Compare-at price must be a whole number.")
    .min(0, "Compare-at price cannot be negative.")
    .max(10_000_000_00, "Compare-at price is too large.")
    .optional()
    .nullable(),
  currency: z
    .string()
    .trim()
    .regex(CURRENCY_REGEX, "Currency must be a 3-letter ISO code (e.g. INR).")
    .default("INR"),
  category_id: z.string().uuid().optional().nullable(),
  features: stringArraySchema.optional().default([]),
  benefits: stringArraySchema.optional().default([]),
  preview_content: z.string().trim().max(5_000).optional().nullable(),
  drive_folder_url: z.string().trim().max(2_000).optional().nullable(),
  is_featured: z.boolean().optional().default(false),
  is_best_seller: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).max(999_999).optional().default(0),
  seo_title: z.string().trim().max(70).optional().nullable(),
  seo_description: z.string().trim().max(160).optional().nullable(),
};

/** POST /api/admin/products — create. */
export const createProductSchema = z.object({
  ...productBaseSchema,
});

/** PATCH /api/admin/products/:id — partial update. */
export const updateProductSchema = z
  .object({
    ...productBaseSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

/** PATCH /api/admin/products/:id/status — lifecycle change. */
export const updateProductStatusSchema = z.object({
  status: z.enum(["active", "inactive", "archived"], {
    errorMap: () => ({ message: "Status must be active, inactive, or archived." }),
  }),
});

/** GET /api/admin/products — list query params. */
export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(["name", "price", "created", "updated", "sort_order"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

/** UUID path param. */
export const productIdParamSchema = z.object({
  id: z.string().uuid("Invalid product ID."),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateProductStatusInput = z.infer<typeof updateProductStatusSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
