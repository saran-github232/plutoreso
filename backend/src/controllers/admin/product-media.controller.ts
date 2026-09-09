import type { Request, Response } from "express";
import {
  listMediaForProduct,
  getMediaById,
  createMedia,
  updateMedia,
  deleteMedia,
} from "../../repositories/product-media.repository.js";
import { getProductById } from "../../repositories/product.repository.js";
import { writeAuditLog } from "../../auth/audit.js";
import {
  createProductMediaSchema,
  updateProductMediaSchema,
  mediaIdParamSchema,
} from "../../validation/product-media.schemas.js";
import { productIdParamSchema } from "../../validation/product.schemas.js";
import type { SessionPrincipal } from "../../auth/session.manager.js";

/**
 * Admin product-media controllers (Phase 5 / Master Guide §18).
 */

export async function listMediaHandler(
  req: Request,
  res: Response
): Promise<void> {
  const paramParse = productIdParamSchema.safeParse(req.params);
  if (!paramParse.success) {
    res.status(400).json({ error: { message: "Invalid product ID." } });
    return;
  }

  const media = await listMediaForProduct(paramParse.data.id);
  res.json({ media });
}

export async function createMediaHandler(
  req: Request,
  res: Response
): Promise<void> {
  const paramParse = productIdParamSchema.safeParse(req.params);
  if (!paramParse.success) {
    res.status(400).json({ error: { message: "Invalid product ID." } });
    return;
  }

  const bodyParse = createProductMediaSchema.safeParse(req.body);
  if (!bodyParse.success) {
    res.status(400).json({
      error: { message: "Validation failed.", details: bodyParse.error.issues },
    });
    return;
  }

  const admin = req.admin as SessionPrincipal;
  const { id: productId } = paramParse.data;

  // Verify product exists.
  const product = await getProductById(productId);
  if (!product) {
    res.status(404).json({ error: { message: "Product not found." } });
    return;
  }

  const data = bodyParse.data;
  const media = await createMedia({
    product_id: productId,
    media_type: data.media_type,
    url: data.url,
    alt_text: data.alt_text ?? null,
    sort_order: data.sort_order ?? 0,
  });

  await writeAuditLog({
    actorId: admin.adminId,
    action: "media.create",
    entityType: "product_media",
    entityId: media.id,
    ip: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
    metadata: { productId, mediaType: media.media_type },
  });

  res.status(201).json({ media });
}

export async function updateMediaHandler(
  req: Request,
  res: Response
): Promise<void> {
  const paramParse = mediaIdParamSchema.safeParse(req.params);
  if (!paramParse.success) {
    res.status(400).json({ error: { message: "Invalid media parameters." } });
    return;
  }

  const bodyParse = updateProductMediaSchema.safeParse(req.body);
  if (!bodyParse.success) {
    res.status(400).json({
      error: { message: "Validation failed.", details: bodyParse.error.issues },
    });
    return;
  }

  const admin = req.admin as SessionPrincipal;
  const { mediaId } = paramParse.data;
  const data = bodyParse.data;

  const existing = await getMediaById(mediaId);
  if (!existing) {
    res.status(404).json({ error: { message: "Media not found." } });
    return;
  }

  const media = await updateMedia(mediaId, {
    media_type: data.media_type,
    url: data.url,
    alt_text: data.alt_text,
    sort_order: data.sort_order,
  });

  await writeAuditLog({
    actorId: admin.adminId,
    action: "media.edit",
    entityType: "product_media",
    entityId: mediaId,
    ip: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
    metadata: { changedFields: Object.keys(data) },
  });

  res.json({ media });
}

export async function deleteMediaHandler(
  req: Request,
  res: Response
): Promise<void> {
  const paramParse = mediaIdParamSchema.safeParse(req.params);
  if (!paramParse.success) {
    res.status(400).json({ error: { message: "Invalid media parameters." } });
    return;
  }

  const admin = req.admin as SessionPrincipal;
  const { mediaId, id: productId } = paramParse.data;

  const existing = await getMediaById(mediaId);
  if (!existing) {
    res.status(404).json({ error: { message: "Media not found." } });
    return;
  }

  await deleteMedia(mediaId);

  await writeAuditLog({
    actorId: admin.adminId,
    action: "media.delete",
    entityType: "product_media",
    entityId: mediaId,
    ip: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
    metadata: { productId, mediaType: existing.media_type },
  });

  res.status(204).send();
}
