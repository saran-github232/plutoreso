import type { Request, Response } from "express";
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  isCategorySlugTaken,
  generateUniqueCategorySlug,
} from "../../repositories/category.repository.js";
import { writeAuditLog } from "../../auth/audit.js";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from "../../validation/category.schemas.js";
import type { SessionPrincipal } from "../../auth/session.manager.js";

/**
 * Admin category controllers (Phase 5 / Master Guide §17).
 */

export async function listCategoriesHandler(
  _req: Request,
  res: Response
): Promise<void> {
  const categories = await listCategories();
  res.json({ categories });
}

export async function createCategoryHandler(
  req: Request,
  res: Response
): Promise<void> {
  const bodyParse = createCategorySchema.safeParse(req.body);
  if (!bodyParse.success) {
    res.status(400).json({
      error: { message: "Validation failed.", details: bodyParse.error.issues },
    });
    return;
  }

  const admin = req.admin as SessionPrincipal;
  const data = bodyParse.data;

  const slugTaken = await isCategorySlugTaken(data.slug);
  const finalSlug = slugTaken
    ? await generateUniqueCategorySlug(data.slug)
    : data.slug;

  const category = await createCategory({
    name: data.name,
    slug: finalSlug,
    description: data.description ?? null,
    is_active: data.is_active ?? true,
    sort_order: data.sort_order ?? 0,
  });

  await writeAuditLog({
    actorId: admin.adminId,
    action: "category.create",
    entityType: "categories",
    entityId: category.id,
    ip: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
    metadata: { name: category.name, slug: category.slug },
  });

  res.status(201).json({ category });
}

export async function updateCategoryHandler(
  req: Request,
  res: Response
): Promise<void> {
  const paramParse = categoryIdParamSchema.safeParse(req.params);
  if (!paramParse.success) {
    res.status(400).json({ error: { message: "Invalid category ID." } });
    return;
  }

  const bodyParse = updateCategorySchema.safeParse(req.body);
  if (!bodyParse.success) {
    res.status(400).json({
      error: { message: "Validation failed.", details: bodyParse.error.issues },
    });
    return;
  }

  const admin = req.admin as SessionPrincipal;
  const { id } = paramParse.data;
  const data = bodyParse.data;

  const existing = await getCategoryById(id);
  if (!existing) {
    res.status(404).json({ error: { message: "Category not found." } });
    return;
  }

  // Slug conflict check on edit.
  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await isCategorySlugTaken(data.slug, id);
    if (slugTaken) {
      res.status(409).json({
        error: { message: "A category with this slug already exists." },
      });
      return;
    }
  }

  const category = await updateCategory(id, {
    name: data.name,
    slug: data.slug,
    description: data.description,
    is_active: data.is_active,
    sort_order: data.sort_order,
  });

  await writeAuditLog({
    actorId: admin.adminId,
    action: "category.edit",
    entityType: "categories",
    entityId: id,
    ip: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
    metadata: { changedFields: Object.keys(data) },
  });

  res.json({ category });
}
