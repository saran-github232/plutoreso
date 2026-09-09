import type { NextFunction, Request, Response } from "express";
import { DatabaseNotConfiguredError } from "../../db/client.js";
import { getCategoryById } from "../../repositories/category.repository.js";
import {
  getActiveProductBySlug,
  listActiveCategories,
  listActiveProducts,
  listPublicMediaForProduct,
} from "../../repositories/catalog.repository.js";
import {
  catalogSlugParamSchema,
  listCatalogQuerySchema,
} from "../../validation/catalog.schemas.js";
import {
  toPublicCategory,
  toPublicProductCard,
  toPublicProductDetail,
} from "./catalog.dto.js";

/**
 * Public storefront catalog controllers (Phase 6).
 *
 * No authentication required. Only active products / active categories are
 * served, through customer-safe DTOs that never include drive_folder_id.
 * A missing database yields 503 (honest, retryable) — never a leak.
 */

function isDbMissing(error: unknown): boolean {
  return (
    error instanceof DatabaseNotConfiguredError ||
    (error as { name?: string } | null)?.name === "DatabaseNotConfiguredError"
  );
}

export async function listCatalogHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const parsed = listCatalogQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: "Invalid catalog query parameters.", details: parsed.error.issues },
    });
    return;
  }

  try {
    const { page, perPage, category, search, sort, featured, bestSeller } = parsed.data;
    const result = await listActiveProducts({
      page,
      perPage,
      categorySlug: category,
      search,
      sort,
      featured,
      bestSeller,
    });

    const products = await Promise.all(
      result.products.map(async (row) => {
        const categoryRow = row.category_id ? await getCategoryById(row.category_id) : null;
        const media = await listPublicMediaForProduct(row.id);
        return toPublicProductCard(row, categoryRow, media);
      })
    );

    const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / result.perPage);
    res.json({
      products,
      pagination: { page: result.page, perPage: result.perPage, total: result.total, totalPages },
    });
  } catch (error) {
    if (isDbMissing(error)) {
      res.status(503).json({ error: { message: "Catalog is temporarily unavailable." } });
      return;
    }
    next(error);
  }
}

export async function getCatalogProductHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const parsed = catalogSlugParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Invalid product slug." } });
    return;
  }

  try {
    const row = await getActiveProductBySlug(parsed.data.slug);
    if (!row) {
      res.status(404).json({ error: { message: "Product not found." } });
      return;
    }

    const categoryRow = row.category_id ? await getCategoryById(row.category_id) : null;
    const media = await listPublicMediaForProduct(row.id);
    res.json({ product: toPublicProductDetail(row, categoryRow, media) });
  } catch (error) {
    if (isDbMissing(error)) {
      res.status(503).json({ error: { message: "Catalog is temporarily unavailable." } });
      return;
    }
    next(error);
  }
}

export async function listCatalogCategoriesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categories = await listActiveCategories();
    res.json({ categories: categories.map(toPublicCategory) });
  } catch (error) {
    if (isDbMissing(error)) {
      res.status(503).json({ error: { message: "Catalog is temporarily unavailable." } });
      return;
    }
    next(error);
  }
}

