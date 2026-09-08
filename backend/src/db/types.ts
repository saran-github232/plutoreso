/**
 * Typed database models mirroring the Phase 3 schema (docs/DATABASE.md).
 *
 * - Branded ID types make it hard to confuse product/order/payment/entitlement IDs.
 * - Row interfaces use the exact snake_case column names pg returns.
 * - jsonb columns are typed as unknown/records: shapes are validated at the
 *   application layer when features consume them.
 * - Generated Supabase types (`supabase gen types typescript`) can replace or
 *   supplement these once a live project exists — see docs/DATABASE.md.
 *   Do NOT fabricate generated types.
 */

declare const __brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type AdminId = Brand<string, "AdminId">;
export type CustomerId = Brand<string, "CustomerId">;
export type CategoryId = Brand<string, "CategoryId">;
export type ProductId = Brand<string, "ProductId">;
export type ProductMediaId = Brand<string, "ProductMediaId">;
export type OrderId = Brand<string, "OrderId">;
export type OrderItemId = Brand<string, "OrderItemId">;
export type PaymentId = Brand<string, "PaymentId">;
export type EntitlementId = Brand<string, "EntitlementId">;
export type CouponId = Brand<string, "CouponId">;
export type BundleRuleId = Brand<string, "BundleRuleId">;
export type WebhookEventId = Brand<string, "WebhookEventId">;
export type TestimonialId = Brand<string, "TestimonialId">;
export type AuditLogId = Brand<string, "AuditLogId">;

export type ProductStatus = "active" | "inactive" | "archived";
export type OrderStatus =
  | "PENDING"
  | "PAYMENT_INITIATED"
  | "PAID"
  | "FULFILLED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";
export type PaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "partially_refunded";
export type EntitlementStatus = "active" | "revoked" | "expired";
export type ProductMediaType = "image" | "video" | "preview";
export type DiscountType = "percentage" | "fixed";
export type BundleRole = "trigger" | "bonus";
export type WebhookStatus = "received" | "processed" | "failed" | "skipped";

export interface AdminRow {
  id: AdminId;
  email: string;
  name: string;
  role: "owner" | "admin";
  status: "active" | "disabled";
  /** bcrypt/argon2 hash from Phase 4 — NEVER select into API responses. */
  password_hash: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerRow {
  id: CustomerId;
  email: string;
  name: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryRow {
  id: CategoryId;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductRow {
  id: ProductId;
  name: string;
  slug: string;
  short_description: string;
  full_description: string | null;
  /** Integer minor units (paise for INR) — never floating point. */
  price_minor: number;
  compare_at_price_minor: number | null;
  currency: string;
  category_id: CategoryId | null;
  features: unknown[];
  benefits: unknown[];
  preview_content: string | null;
  /** SERVER-ONLY. Never expose publicly (Master Guide §5). */
  drive_folder_id: string | null;
  status: ProductStatus;
  is_featured: boolean;
  is_best_seller: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductMediaRow {
  id: ProductMediaId;
  product_id: ProductId;
  media_type: ProductMediaType;
  /** PUBLIC presentation URL — never a protected Drive delivery link. */
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: Date;
}

export interface CouponRow {
  id: CouponId;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  currency: string | null;
  is_active: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
  max_redemptions: number | null;
  max_redemptions_per_customer: number | null;
  min_order_amount_minor: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface BundleRuleRow {
  id: BundleRuleId;
  name: string;
  description: string | null;
  is_active: boolean;
  /** App-validated config; deliberately flexible (Master Guide §16). */
  conditions: Record<string, unknown>;
  starts_at: Date | null;
  ends_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface BundleRuleProductRow {
  id: string;
  rule_id: BundleRuleId;
  product_id: ProductId;
  role: BundleRole;
  quantity: number;
}

export interface OrderRow {
  id: OrderId;
  order_number: string;
  customer_id: CustomerId;
  status: OrderStatus;
  subtotal_minor: number;
  discount_minor: number;
  total_minor: number;
  currency: string;
  coupon_id: CouponId | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRow {
  id: OrderItemId;
  order_id: OrderId;
  product_id: ProductId;
  product_name_snapshot: string;
  product_slug_snapshot: string;
  unit_price_minor: number;
  compare_at_price_minor: number | null;
  quantity: number;
  line_discount_minor: number;
  line_total_minor: number;
  created_at: Date;
}

export interface PaymentRow {
  id: PaymentId;
  order_id: OrderId;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  status: PaymentStatus;
  amount_minor: number;
  currency: string;
  method: string | null;
  error_code: string | null;
  error_description: string | null;
  raw_metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface EntitlementRow {
  id: EntitlementId;
  customer_id: CustomerId;
  order_id: OrderId;
  product_id: ProductId;
  status: EntitlementStatus;
  granted_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CouponRedemptionRow {
  id: string;
  coupon_id: CouponId;
  order_id: OrderId;
  customer_id: CustomerId;
  discount_minor: number;
  created_at: Date;
}

export interface WebhookEventRow {
  id: WebhookEventId;
  provider: string;
  event_type: string;
  external_event_id: string | null;
  /** SHA-256 of the raw body — primary idempotency key. */
  fingerprint: string;
  payload: Record<string, unknown>;
  status: WebhookStatus;
  processed_at: Date | null;
  error_message: string | null;
  created_at: Date;
}

export interface TestimonialRow {
  id: TestimonialId;
  author_name: string;
  content: string;
  rating: number | null;
  is_active: boolean;
  sort_order: number;
  customer_id: CustomerId | null;
  created_at: Date;
  updated_at: Date;
}

export interface SiteSettingRow {
  key: string;
  value: unknown;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLogRow {
  id: AuditLogId;
  actor_admin_id: AdminId | null;
  actor_type: "admin" | "system";
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: Date;
}

