import { Router } from "express";
import { requireAdmin } from "../auth/auth.middleware.js";
import {
  listProductsHandler,
  getProductHandler,
  createProductHandler,
  updateProductHandler,
  updateProductStatusHandler,
  deleteProductHandler,
} from "../controllers/admin/product.controller.js";
import {
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
} from "../controllers/admin/category.controller.js";
import {
  listMediaHandler,
  createMediaHandler,
  updateMediaHandler,
  deleteMediaHandler,
} from "../controllers/admin/product-media.controller.js";

/**
 * Admin product/category/media routes (Phase 5 / Master Guide §17–§19).
 *
 * Every route requires an authenticated, active admin session (requireAdmin).
 * No public storefront product routes exist in Phase 5.
 */

const adminProductsRouter = Router();

// --- Products ---
adminProductsRouter.get("/products", requireAdmin, listProductsHandler);
adminProductsRouter.post("/products", requireAdmin, createProductHandler);
adminProductsRouter.get("/products/:id", requireAdmin, getProductHandler);
adminProductsRouter.patch("/products/:id", requireAdmin, updateProductHandler);
adminProductsRouter.patch(
  "/products/:id/status",
  requireAdmin,
  updateProductStatusHandler
);
adminProductsRouter.delete("/products/:id", requireAdmin, deleteProductHandler);

// --- Product media ---
adminProductsRouter.get(
  "/products/:id/media",
  requireAdmin,
  listMediaHandler
);
adminProductsRouter.post(
  "/products/:id/media",
  requireAdmin,
  createMediaHandler
);
adminProductsRouter.patch(
  "/products/:id/media/:mediaId",
  requireAdmin,
  updateMediaHandler
);
adminProductsRouter.delete(
  "/products/:id/media/:mediaId",
  requireAdmin,
  deleteMediaHandler
);

// --- Categories ---
adminProductsRouter.get("/categories", requireAdmin, listCategoriesHandler);
adminProductsRouter.post("/categories", requireAdmin, createCategoryHandler);
adminProductsRouter.patch(
  "/categories/:id",
  requireAdmin,
  updateCategoryHandler
);

export { adminProductsRouter };
