import { z } from "zod";

/**
 * Category validation schemas (Phase 5 / Master Guide §17).
 */

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** POST /api/admin/categories — create. */
export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(200)
    .regex(SLUG_REGEX, "Slug must be lowercase letters, numbers, and hyphens only."),
  description: z.string().trim().max(2_000).optional().nullable(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).max(999_999).optional().default(0),
});

/** PATCH /api/admin/categories/:id — partial update. */
export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

/** UUID path param. */
export const categoryIdParamSchema = z.object({
  id: z.string().uuid("Invalid category ID."),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
