import { Router } from "express";
import {
  getCatalogProductHandler,
  listCatalogCategoriesHandler,
  listCatalogHandler,
} from "../controllers/public/catalog.controller.js";

/**
 * Public storefront catalog routes (Phase 6).
 *
 * No authentication — active products / active categories only, served
 * through customer-safe DTOs (drive_folder_id never leaves the server).
 */
export const catalogRouter = Router();

catalogRouter.get("/products", listCatalogHandler);
catalogRouter.get("/products/:slug", getCatalogProductHandler);
catalogRouter.get("/categories", listCatalogCategoriesHandler);
