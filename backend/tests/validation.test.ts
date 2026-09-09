import { describe, expect, it } from "vitest";
import {
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
  listProductsQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  createProductMediaSchema,
  updateProductMediaSchema,
} from "../src/validation/product.schemas.js";

/**
 * Phase 5 — Validation tests (part 1: schemas).
 */

describe("createProductSchema", () => {
  const validProduct = {
    name: "Test Product",
    slug: "test-product",
    short_description: "A great product",
    full_description: "Full details here",
    price_minor: 19900,
    compare_at_price_minor: 24900,
    currency: "INR",
    features: ["Feature 1", "Feature 2"],
    benefits: ["Benefit 1"],
    preview_content: "Preview text",
    is_featured: true,
    is_best_seller: false,
    sort_order: 1,
    seo_title: "SEO Title",
    seo_description: "SEO Description",
  };

  it("accepts a valid product", () => {
    const result = createProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createProductSchema.safeParse({ ...validProduct, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug with uppercase", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      slug: "Invalid-Slug",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug with spaces", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      slug: "invalid slug",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      price_minor: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer price", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      price_minor: 19.99,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid currency", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      currency: "rupees",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty short_description", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      short_description: "",
    });
    expect(result.success).toBe(false);
  });

  it("applies defaults for optional fields", () => {
    const result = createProductSchema.safeParse({
      name: "Minimal",
      slug: "minimal",
      short_description: "Short",
      price_minor: 1000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("INR");
      expect(result.data.features).toEqual([]);
      expect(result.data.benefits).toEqual([]);
      expect(result.data.is_featured).toBe(false);
      expect(result.data.is_best_seller).toBe(false);
      expect(result.data.sort_order).toBe(0);
    }
  });
});

describe("updateProductSchema", () => {
  it("accepts partial update", () => {
    const result = updateProductSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("rejects empty object", () => {
    const result = updateProductSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("updateProductStatusSchema", () => {
  it.each(["active", "inactive", "archived"])("accepts status %s", (status) => {
    const result = updateProductStatusSchema.safeParse({ status });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updateProductStatusSchema.safeParse({ status: "draft" });
    expect(result.success).toBe(false);
  });

  it("rejects missing status", () => {
    const result = updateProductStatusSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("listProductsQuerySchema", () => {
  it("applies defaults", () => {
    const result = listProductsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.perPage).toBe(20);
    }

describe("createCategorySchema", () => {
  it("accepts a valid category", () => {
    const result = createCategorySchema.safeParse({
      name: "E-books",
      slug: "e-books",
      description: "Digital books",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug", () => {
    const result = createCategorySchema.safeParse({
      name: "E-books",
      slug: "E-Books!",
    });
    expect(result.success).toBe(false);
  });

  it("applies defaults", () => {
    const result = createCategorySchema.safeParse({
      name: "Test",
      slug: "test",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
      expect(result.data.sort_order).toBe(0);
    }
  });
});

describe("updateCategorySchema", () => {
  it("accepts partial update", () => {
    const result = updateCategorySchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("rejects empty object", () => {
    const result = updateCategorySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("createProductMediaSchema", () => {
  it("accepts valid media", () => {
    const result = createProductMediaSchema.safeParse({
      media_type: "image",
      url: "https://example.com/image.jpg",
      alt_text: "Product image",
    });
    expect(result.success).toBe(true);
  });

  it.each(["image", "video", "preview"])("accepts media_type %s", (type) => {
    const result = createProductMediaSchema.safeParse({
      media_type: type,
      url: "https://example.com/file",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid media_type", () => {
    const result = createProductMediaSchema.safeParse({
      media_type: "document",
      url: "https://example.com/file",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = createProductMediaSchema.safeParse({
      media_type: "image",
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProductMediaSchema", () => {
  it("accepts partial update", () => {
    const result = updateProductMediaSchema.safeParse({ alt_text: "New alt" });
    expect(result.success).toBe(true);
  });

  it("rejects empty object", () => {
    const result = updateProductMediaSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

  });

  it("accepts valid status filter", () => {
    const result = listProductsQuerySchema.safeParse({ status: "active" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status filter", () => {
    const result = listProductsQuerySchema.safeParse({ status: "draft" });
    expect(result.success).toBe(false);
  });

  it("coerces string page to number", () => {
    const result = listProductsQuerySchema.safeParse({
      page: "3",
      perPage: "50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.perPage).toBe(50);
    }
  });
});
