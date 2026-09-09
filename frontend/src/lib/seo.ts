/**
 * Minimal client-side SEO for the storefront (Phase 6).
 *
 * Sets the document title and the meta description for API-driven pages.
 * Only public catalog data is ever placed here — never internal fields.
 * Omitted fields reset to the site defaults (index.html baseline).
 */

import { siteConfig } from "../config/site";

const DEFAULT_TITLE = `${siteConfig.name} — Premium Digital Products`;
const DEFAULT_DESCRIPTION = siteConfig.description;

function upsertMetaDescription(content: string): void {
  let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }
  meta.content = content;
}

/**
 * Applies page title + meta description (fire-and-forget). Passing no options
 * (or undefined fields) restores the site-wide defaults — useful when
 * navigating back to the homepage or when catalog SEO fields are absent.
 */
export function applyPageSeo(
  options: { title?: string; description?: string | null } = {}
): void {
  document.title = options.title ?? DEFAULT_TITLE;
  upsertMetaDescription(options.description ?? DEFAULT_DESCRIPTION);
}

