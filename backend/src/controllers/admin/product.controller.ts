import type { Request, Response } from "express";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  archiveProduct,
  isSlugTaken,
  generateUniqueSlug,
} from "../../repositories/product.repository.js";
import { writeAuditLog } from "../../auth/audit.js";
import {
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
  listProductsQuerySchema,
  productIdParamSchema,
} from "../../validation/product.schemas.js";
import { validateAndExtractDriveFolderId } from "../../services/drive-url.service.js";
import type { SessionPrincipal } from "../../auth/session.manager.js";
import type { CategoryId } from "../../db/types.js";

/**
 * Admin product controllers (Phase 5 / Master Guide §18–§19).
 */

export async function listProductsHandler(
  req: Request,
  res: Response
): Promise<void> {
  const queryParse = listProductsQuerySchema.safeParse(req.query);
  if (!queryParse.success) {
    res.status(400).json({ error: { message: "Invalid query parameters." } });
    return;
  }

  const { page, perPage, status, categoryId, search, sort, order } =
    queryParse.data;

  const result = await listProducts({
    page,
    perPage,
    status,
    categoryId,
    search,
    sort,
    order,
  });

  res.json({
    products: result.products,
    pagination: {
      page: result.page,
      perPage: result.perPage,
      total: result.total,
      totalPages: Math.ceil(result.total / result.perPage),
    },
  });
}

export async function getProductHandler(
  req: Request,
  res: Response
): Promise<void> {
  const paramParse = productIdParamSchema.safeParse(req.params);
  if (!paramParse.success) {
    res.status(400).json({ error: { message: "Invalid product ID." } });
    return;
  }

  const product = await getProductById(paramParse.data.id);
  if (!product) {
    res.status(404).json({ error: { message: "Product not found." } });
    return;
  }

  res.json({ product });
}

export async function createProductHandler(
  req: Request,
  res: Response
): Promise<void> {
  const bodyParse = createProductSchema.safeParse(req.body);
  if (!bodyParse.success) {
    res.status(400).json({
      error: { message: "Validation failed.", details: bodyParse.error.issues },
    });
    return;
  }

  const admin = req.admin as SessionPrincipal;
  const data = bodyParse.data;

  let driveFolderId: string | null = null;
  if (data.drive_folder_url) {
    const driveResult = validateAndExtractDriveFolderId(data.drive_folder_url);
    if (!driveResult.valid) {
      res.status(400).json({ error: { message: driveResult.error } });
      return;
    }
    driveFolderId = driveResult.folderId;
  }

  const slugTaken = await isSlugTaken(data.slug);
  const finalSlug = slugTaken
    ? await generateUniqueSlug(data.slug)
    : data.slug;

  if (data.category_id) {
    const { getCategoryById } = await import("../../repositories/category.repository.js");
    const category = await getCategoryById(data.category_id);
    if (!category) {
      res.status(400).json({ error: { message: "Category not found." } });
      return;
    }
  }

  const product = await createProduct({
    name: data.name,
    slug: finalSlug,
    short_description: data.short_description,
    full_description: data.full_description ?? null,
    price_minor: data.price_minor,
    compare_at_price_minor: data.compare_at_price_minor ?? null,
    currency: data.currency,
    category_id: (data.category_id ?? null) as CategoryId | null,
    features: data.features ?? [],
    benefits: data.benefits ?? [],
    preview_content: data.preview_content ?? null,
    drive_folder_id: driveFolderId,
    status: "inactive",
    is_featured: data.is_featured ?? false,
    is_best_seller: data.is_best_seller ?? false,
    sort_order: data.sort_order ?? 0,
    seo_title: data.seo_title ?? null,
    seo_description: data.seo_description ?? null,
  });

  await writeAuditLog({
    actorId: admin.adminId,
    action: "product.create",
    entityType: "products",
    entityId: product.id,
    ip: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
    metadata: { name: product.name, slug: product.slug },
  });

  res.status(201).json({ product });
}

export async function updateProductHandler(
  req: Request,
  res: Response
): Promise<void> {
  const paramParse = productIdParamSchema.safeParse(req.params);
  if (!paramParse.success) {
    res.status(400).json({ error: { message: "Invalid product ID." } });
    return;
  }

  const bodyParse = updateProductSchema.safeParse(req.body);
  if (!bodyParse.success) {
    res.status(400).json({
      error: { message: "Validation failed.", details: bodyParse.error.issues },
    });
    return;
  }

  const admin = req.admin as SessionPrincipal;
  const { id } = paramParse.data;
  const data = bodyParse.data;

  const existing = await getProductById(id);
  if (!existing) {
    res.status(404).json({ error: { message: "Product not found." } });
    return;
  }

  let driveFolderId: string | null | undefined = undefined;
  if (data.drive_folder_url !== undefined) {
    const driveResult = validateAndExtractDriveFolderId(data.drive_folder_url);
    if (!driveResult.valid) {
      res.status(400).json({ error: { message: driveResult.error } });
      return;
    }
    driveFolderId = driveResult.folderId;
  }

  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await isSlugTaken(data.slug, id);
    if (slugTaken) {
      res.status(409).json({
        error: { message: "A product with this slug already exists." },
      });
      return;
    }
  }

  if (data.category_id) {
    const { getCategoryById } = await import("../../repositories/category.repository.js");
    const category = await getCategoryById(data.category_id);
    if (!category) {
      res.status(400).json({ error: { message: "Category not found." } });
      return;
    }
  }

  const product = await updateProduct(id, {
    name: data.name,
    slug: data.slug,
    short_description: data.short_description,
    full_description: data.full_description,
    price_minor: data.price_minor,
    compare_at_price_minor: data.compare_at_price_minor,
    currency: data.currency,
    category_id: data.category_id as CategoryId | null | undefined,
    features: data.features,
    benefits: data.benefits,
    preview_content: data.preview_content,
    drive_folder_id: driveFolderId,
    is_featured: data.is_featured,
    is_best_seller: data.is_best_seller,
    sort_order: data.sort_order,
    seo_title: data.seo_title,
    seo_description: data.seo_description,
  });

  await writeAuditLog({
    actorId: admin.adminId,
    action: "product.edit",
    entityType: "products",
    entityId: id,
    ip: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
    metadata: {
      changedFields: Object.keys(data),
      slug: product?.slug,
    },
  });

  res.json({ product });
}

export async function updateProductStatusHandler(
  req: Request,
  res: Response
): Promise<void> {
  const paramParse = productIdParamSchema.safeParse(req.params);
  if (!paramParse.success) {
    res.status(400).json({ error: { message: "Invalid product ID." } });
    return;
  }

  const bodyParse = updateProductStatusSchema.safeParse(req.body);
  if (!bodyParse.success) {
    res.status(400).json({
      error: { message: "Validation failed.", details: bodyParse.error.issues },
    });
    return;
  }

  const admin = req.admin as SessionPrincipal;
  const { id } = paramParse.data;
  const { status } = bodyParse.data;

  const existing = await getProductById(id);
  if (!existing) {
    res.status(404).json({ error: { message: "Product not found." } });
    return;
  }

  const product = await updateProductStatus(id, status);

  await writeAuditLog({
    actorId: admin.adminId,
    action: "product.status-change",
    entityType: "products",
    entityId: id,
    ip: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
    metadata: { from: existing.status, to: status },
  });

  res.json({ product });
}

export async function deleteProductHandler(
  req: Request,
  res: Response
): Promise<void> {
  const paramParse = productIdParamSchema.safeParse(req.params);
  if (!paramParse.success) {
    res.status(400).json({ error: { message: "Invalid product ID." } });
    return;
  }

  const admin = req.admin as SessionPrincipal;
  const { id } = paramParse.data;

  const existing = await getProductById(id);
  if (!existing) {
    res.status(404).json({ error: { message: "Product not found." } });
    return;
  }

  const product = await archiveProduct(id);

  await writeAuditLog({
    actorId: admin.adminId,
    action: "product.archive",
    entityType: "products",
    entityId: id,
    ip: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
    metadata: { name: existing.name, previousStatus: existing.status },
  });

  res.json({ product });
}

