import { describe, expect, it } from "vitest";
import {
  catalogSlugParamSchema,
  listCatalogQuerySchema,
} from "../src/validation/catalog.schemas.js";
import {
  toPublicCategory,
  toPublicMedia,
  toPublicProductCard,
  toPublicProductDetail,
} from "../src/controllers/public/catalog.dto.js";
import type { CategoryRow, ProductMediaRow, ProductRow } from "../src/db/types.js";

/**
 * Phase 6 — Public catalog tests.
 *
 * Covers: query/slug validation, pagination bounds, sort whitelists, and the
 * customer-safe DTO shapes (notably: drive_folder_id never leaves the server).
 */

function makeProductRow(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Test Product",
    slug: "test-product",
    short_description: "Short description",
    full_description: "Full description",
    price_minor: 149900,
    compare_at_price_minor: 199900,
    currency: "INR",
    category_id: "22222222-2222-4222-8222-222222222222",
    features: ["Feature A"],
    benefits: ["Benefit A"],
    preview_content: "Preview text",
    drive_folder_id: "SECRET_FOLDER_ID",
    status: "active",
    is_featured: true,
    is_best_seller: false,
    sort_order: 1,
    seo_title: "SEO title",
    seo_description: "SEO description",
    created_at: new Date("2026-01-01T00:00:00Z"),
    updated_at: new Date("2026-01-02T00:00:00Z"),
    ...overrides,
  } as ProductRow;
}

function makeCategoryRow(): CategoryRow {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Guides",
    slug: "guides",
    description: "Guide category",
    is_active: true,
    sort_order: 0,
    created_at: new Date("2026-01-01T00:00:00Z"),
    updated_at: new Date("2026-01-01T00:00:00Z"),
  };
}

function makeMediaRow(): ProductMediaRow {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    product_id: "11111111-1111-4111-8111-111111111111",
    media_type: "image",
    url: "https://example.com/image.jpg",
    alt_text: "Test image",
    sort_order: 0,
    created_at: new Date("2026-01-01T00:00:00Z"),
  };
}

describe("listCatalogQuerySchema", () => {
  it("applies safe defaults", () => {
    const result = listCatalogQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.perPage).toBe(12);
      expect(result.data.sort).toBe("newest");
    }
  });

  it("accepts search, category, sort, and flags", () => {
    const result = listCatalogQuerySchema.safeParse({
      page: "2",
      perPage: "24",
      category: "guides",
      search: "toolkit",
      sort: "price-asc",
      featured: "true",
      bestSeller: "false",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.perPage).toBe(24);
      expect(result.data.category).toBe("guides");
      expect(result.data.featured).toBe(true);
      expect(result.data.bestSeller).toBe(false);
    }
  });

  it("rejects page 0 and oversized perPage", () => {
    expect(listCatalogQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(listCatalogQuerySchema.safeParse({ perPage: 500 }).success).toBe(false);
  });

  it("rejects invalid category slugs", () => {
    expect(
      listCatalogQuerySchema.safeParse({ category: "Invalid_Category!" }).success
    ).toBe(false);
  });

  it("rejects unknown sort values", () => {
    expect(listCatalogQuerySchema.safeParse({ sort: "random" }).success).toBe(false);
  });
});

describe("catalogSlugParamSchema", () => {
  it("accepts a valid slug", () => {
    expect(catalogSlugParamSchema.safeParse({ slug: "my-product-2" }).success).toBe(true);
  });

  it("rejects uppercase, spaces, and empty slugs", () => {
    expect(catalogSlugParamSchema.safeParse({ slug: "" }).success).toBe(false);
    expect(catalogSlugParamSchema.safeParse({ slug: "Bad Slug" }).success).toBe(false);
    expect(catalogSlugParamSchema.safeParse({ slug: "../admin" }).success).toBe(false);
  });
});

describe("public catalog DTOs", () => {
  it("card DTO exposes only customer-safe fields", () => {
    const dto = toPublicProductCard(makeProductRow(), makeCategoryRow(), [makeMediaRow()]);
    expect(dto.slug).toBe("test-product");
    expect(dto.price_minor).toBe(149900);
    expect(dto.category?.slug).toBe("guides");
    expect(dto.primary_image?.url).toBe("https://example.com/image.jpg");
    expect(dto).not.toHaveProperty("drive_folder_id");
    expect(JSON.stringify(dto)).not.toContain("SECRET_FOLDER_ID");
  });

  it("card DTO handles missing category and media", () => {
    const dto = toPublicProductCard(makeProductRow(), null, []);
    expect(dto.category).toBeNull();
    expect(dto.primary_image).toBeNull();
  });

  it("detail DTO includes marketing content but never drive data", () => {
    const dto = toPublicProductDetail(makeProductRow(), makeCategoryRow(), [makeMediaRow()]);
    expect(dto.features).toEqual(["Feature A"]);
    expect(dto.benefits).toEqual(["Benefit A"]);
    expect(dto.media).toHaveLength(1);
    expect(dto.seo_title).toBe("SEO title");
    expect(dto).not.toHaveProperty("drive_folder_id");
    expect(JSON.stringify(dto)).not.toContain("SECRET_FOLDER_ID");
  });

  it("drops non-string feature/benefit entries", () => {
    const dto = toPublicProductDetail(
      makeProductRow({ features: ["ok", 42, null] as unknown as string[] }),
      null,
      []
    );
    expect(dto.features).toEqual(["ok"]);
  });

  it("category and media DTOs expose safe shapes", () => {
    expect(toPublicCategory(makeCategoryRow())).toEqual({
      id: "22222222-2222-4222-8222-222222222222",
      name: "Guides",
      slug: "guides",
      description: "Guide category",
      sort_order: 0,
    });
    expect(toPublicMedia(makeMediaRow()).url).toBe("https://example.com/image.jpg");
  });
});
