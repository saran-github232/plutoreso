import type { CategoryRow, ProductMediaRow, ProductRow } from "../../db/types.js";

/**
 * Public storefront DTOs (Phase 6).
 *
 * Customer-safe projections only. `drive_folder_id`, audit data, and any
 * internal/admin metadata are deliberately absent from these shapes.
 */

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export interface PublicCategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface PublicMediaDto {
  id: string;
  media_type: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface PublicProductCardDto {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  price_minor: number;
  compare_at_price_minor: number | null;
  currency: string;
  category: PublicCategoryDto | null;
  primary_image: PublicMediaDto | null;
  is_featured: boolean;
  is_best_seller: boolean;
}

export interface PublicProductDetailDto extends PublicProductCardDto {
  full_description: string | null;
  features: string[];
  benefits: string[];
  preview_content: string | null;
  media: PublicMediaDto[];
  seo_title: string | null;
  seo_description: string | null;
}

export function toPublicCategory(row: CategoryRow): PublicCategoryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sort_order: row.sort_order,
  };
}

export function toPublicMedia(row: ProductMediaRow): PublicMediaDto {
  return {
    id: row.id,
    media_type: row.media_type,
    url: row.url,
    alt_text: row.alt_text,
    sort_order: row.sort_order,
  };
}

function primaryImage(media: ProductMediaRow[]): ProductMediaRow | null {
  const images = media.filter((m) => m.media_type === "image");
  if (images.length > 0) return images[0] as ProductMediaRow;
  return media[0] ?? null;
}

export function toPublicProductCard(
  row: ProductRow,
  category: CategoryRow | null,
  media: ProductMediaRow[]
): PublicProductCardDto {
  const primary = primaryImage(media);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    short_description: row.short_description,
    price_minor: row.price_minor,
    compare_at_price_minor: row.compare_at_price_minor,
    currency: row.currency,
    category: category ? toPublicCategory(category) : null,
    primary_image: primary ? toPublicMedia(primary) : null,
    is_featured: row.is_featured,
    is_best_seller: row.is_best_seller,
  };
}

export function toPublicProductDetail(
  row: ProductRow,
  category: CategoryRow | null,
  media: ProductMediaRow[]
): PublicProductDetailDto {
  return {
    ...toPublicProductCard(row, category, media),
    full_description: row.full_description,
    features: toStringArray(row.features),
    benefits: toStringArray(row.benefits),
    preview_content: row.preview_content,
    media: media.map(toPublicMedia),
    seo_title: row.seo_title,
    seo_description: row.seo_description,
  };
}
