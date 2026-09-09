import { z } from "zod";

/**
 * Product media validation schemas (Phase 5 / Master Guide §18).
 *
 * Phase 5 manages media as URL records — no binary uploads.
 */

const MEDIA_TYPES = ["image", "video", "preview"] as const;

/** POST /api/admin/products/:id/media — create. */
export const createProductMediaSchema = z.object({
  media_type: z.enum(MEDIA_TYPES, {
    errorMap: () => ({ message: "Media type must be image, video, or preview." }),
  }),
  url: z
    .string()
    .trim()
    .min(1, "URL is required.")
    .url("Must be a valid URL.")
    .max(2_000),
  alt_text: z.string().trim().max(500).optional().nullable(),
  sort_order: z.number().int().min(0).max(999_999).optional().default(0),
});

/** PATCH /api/admin/products/:id/media/:mediaId — partial update. */
export const updateProductMediaSchema = z
  .object({
    media_type: z.enum(MEDIA_TYPES, {
      errorMap: () => ({ message: "Media type must be image, video, or preview." }),
    }).optional(),
    url: z.string().trim().min(1).url("Must be a valid URL.").max(2_000).optional(),
    alt_text: z.string().trim().max(500).optional().nullable(),
    sort_order: z.number().int().min(0).max(999_999).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

/** Path params for media routes. */
export const mediaIdParamSchema = z.object({
  id: z.string().uuid("Invalid product ID."),
  mediaId: z.string().uuid("Invalid media ID."),
});

export type CreateProductMediaInput = z.infer<typeof createProductMediaSchema>;
export type UpdateProductMediaInput = z.infer<typeof updateProductMediaSchema>;
