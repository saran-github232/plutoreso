import { z } from "zod";

/**
 * Public storefront catalog validation (Phase 6 / Master Guide catalog).
 *
 * Active products only — status is never accepted from the client.
 * Strict bounds keep queries safe: capped perPage, trimmed search, UUID-only
 * category filter, whitelisted sort/order enums.
 */

/** GET /api/products — public list query params. */
export const listCatalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(12),
  category: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Invalid category slug.")
    .optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "name"]).optional().default("newest"),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  bestSeller: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

/** GET /api/products/:slug — SEO-friendly detail lookup. */
export const catalogSlugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Product slug is required.")
    .max(200)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Invalid product slug."),
});

/** GET /api/categories — no params; schema kept for symmetry/extension. */
export const listPublicCategoriesQuerySchema = z.object({});

export type ListCatalogQuery = z.infer<typeof listCatalogQuerySchema>;
export type CatalogSlugParam = z.infer<typeof catalogSlugParamSchema>;
