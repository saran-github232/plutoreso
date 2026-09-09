import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import { Checkbox } from "../components/ui/Checkbox";
import { FormField } from "../components/ui/FormField";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/useToast";
import {
  getProduct, createProduct, updateProduct, createMedia, listCategories, type Category,
} from "../lib/admin-api";

function toRupees(paise: number): number { return paise / 100; }
function toPaise(rupees: string): number { return Math.round(parseFloat(rupees) * 100); }
function generateSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const isEdit = Boolean(id && id !== "new");
  const productId = id && id !== "new" ? id : undefined;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [compareAtRupees, setCompareAtRupees] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [categoryId, setCategoryId] = useState("");
  const [features, setFeatures] = useState("");
  const [benefits, setBenefits] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [driveFolderUrl, setDriveFolderUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [sortOrder, setSortOrder] = useState("0");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [mediaAlt, setMediaAlt] = useState("");

  useEffect(() => {
    void listCategories().then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!productId) { setLoading(false); return; }
    void getProduct(productId)
      .then(({ product }) => {
        setName(product.name); setSlug(product.slug);
        setShortDescription(product.short_description);
        setFullDescription(product.full_description ?? "");
        setPriceRupees(String(toRupees(product.price_minor)));
        setCompareAtRupees(product.compare_at_price_minor ? String(toRupees(product.compare_at_price_minor)) : "");
        setCurrency(product.currency); setCategoryId(product.category_id ?? "");
        setFeatures((product.features ?? []).join("\n"));
        setBenefits((product.benefits ?? []).join("\n"));
        setPreviewContent(product.preview_content ?? "");
        setIsFeatured(product.is_featured); setIsBestSeller(product.is_best_seller);
        setSortOrder(String(product.sort_order));
        setSeoTitle(product.seo_title ?? ""); setSeoDescription(product.seo_description ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load product."))
      .finally(() => setLoading(false));
  }, [productId]);

  function handleNameChange(value: string) {
    setName(value);
    if (!isEdit && !slug) setSlug(generateSlug(value));
  }

  function handleAddMedia(): void {
    const url = mediaUrl.trim();
    if (!url || !url.startsWith("http")) return;
    setMediaList([...mediaList, `${mediaType}|${url}|${mediaAlt.trim()}`]);
    setMediaUrl(""); setMediaAlt("");
  }

  function removeMedia(index: number): void {
    setMediaList(mediaList.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const payload = {
      name: name.trim(), slug: slug.trim(),
      short_description: shortDescription.trim(),
      full_description: fullDescription.trim() || null,
      price_minor: toPaise(priceRupees || "0"),
      compare_at_price_minor: compareAtRupees ? toPaise(compareAtRupees) : null,
      currency, category_id: categoryId || null,
      features: features.split("\n").map((s) => s.trim()).filter(Boolean),
      benefits: benefits.split("\n").map((s) => s.trim()).filter(Boolean),
      preview_content: previewContent.trim() || null,
      drive_folder_url: driveFolderUrl.trim() || null,
      is_featured: isFeatured, is_best_seller: isBestSeller,
      sort_order: parseInt(sortOrder) || 0,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
    };
    try {
      if (productId) {
        await updateProduct(productId, payload);
        notify("Product updated."); navigate("/admin/products");
        return;
      }
      const { product } = await createProduct(payload);
      if (mediaList.length > 0) {
        await Promise.all(mediaList.map(async (item) => {
          const [mt, url, alt] = item.split("|");
          return createMedia(product.id, {
            media_type: mt as "image" | "video" | "preview",
            url, alt_text: alt || null, sort_order: 0,
          });
        }));
      }
      notify("Product created.");
      navigate(`/admin/products/${product.id}/edit`, { replace: true });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function renderBasicInfo() {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" required className="sm:col-span-2">
            {(f) => <Input {...f} value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Product name" required />}
          </FormField>
          <FormField label="Slug" required hint="Lowercase letters, numbers, hyphens">
            {(f) => <Input {...f} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="product-slug" required />}
          </FormField>
          <FormField label="Category">
            {(f) => (
              <Select {...f} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Uncategorized</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </Select>
            )}
          </FormField>
          <FormField label="Short description" required className="sm:col-span-2">
            {(f) => <Textarea {...f} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} required />}
          </FormField>
          <FormField label="Full description" className="sm:col-span-2">
            {(f) => <Textarea {...f} value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} rows={5} />}
          </FormField>
        </div>
      </Card>
    );
  }

  function renderPricing() {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Price (rs)" required hint="In rupees, e.g. 199">
            {(f) => <Input {...f} type="number" min="0" step="0.01" value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)} placeholder="199" required />}
          </FormField>
          <FormField label="Compare-at price (rs)" hint="Original price before discount">
            {(f) => <Input {...f} type="number" min="0" step="0.01" value={compareAtRupees}
              onChange={(e) => setCompareAtRupees(e.target.value)} placeholder="249" />}
          </FormField>
          <FormField label="Currency">
            {(f) => (
              <Select {...f} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </Select>
            )}
          </FormField>
        </div>
      </Card>
    );
  }

  function renderContent() {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Content</h2>
        <div className="grid gap-4">
          <FormField label="Features" hint="One per line">
            {(f) => <Textarea {...f} value={features} onChange={(e) => setFeatures(e.target.value)} rows={4} placeholder={"Feature 1\nFeature 2"} />}
          </FormField>
          <FormField label="Benefits" hint="One per line">
            {(f) => <Textarea {...f} value={benefits} onChange={(e) => setBenefits(e.target.value)} rows={4} placeholder={"Benefit 1\nBenefit 2"} />}
          </FormField>
          <FormField label="Preview content">
            {(f) => <Textarea {...f} value={previewContent} onChange={(e) => setPreviewContent(e.target.value)} rows={3} />}
          </FormField>
        </div>
      </Card>
    );
  }

  function renderDelivery() {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Delivery</h2>
        <FormField label="Google Drive folder URL" hint="Paste the full folder URL - only the folder ID is stored server-side">
          {(f) => <Input {...f} value={driveFolderUrl} onChange={(e) => setDriveFolderUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..." />}
        </FormField>
      </Card>
    );
  }

  function renderSettings() {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Status & Flags</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} /> Best seller
          </label>
          <FormField label="Sort order">
            {(f) => <Input {...f} type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />}
          </FormField>
        </div>
      </Card>
    );
  }

  function renderSeo() {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">SEO</h2>
        <div className="grid gap-4">
          <FormField label="SEO title" hint="Max 70 characters">
            {(f) => <Input {...f} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} />}
          </FormField>
          <FormField label="SEO description" hint="Max 160 characters">
            {(f) => <Textarea {...f} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} maxLength={160} />}
          </FormField>
        </div>
      </Card>
    );
  }

  function renderMedia() {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Media (URL records)</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-32">
            <Select value={mediaType} onChange={(e) => setMediaType(e.target.value)} aria-label="Media type">
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="preview">Preview</option>
            </Select>
          </div>
          <div className="flex-1">
            <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://... (image/video/preview URL)" />
          </div>
          <div className="flex-1">
            <Input value={mediaAlt} onChange={(e) => setMediaAlt(e.target.value)} placeholder="Alt text (optional)" />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddMedia}>
            <Plus className="h-4 w-4" aria-hidden="true" /><span className="ml-1">Add</span>
          </Button>
        </div>
        {mediaList.length > 0 && (
          <ul className="mt-3 space-y-2">
            {mediaList.map((item, i) => {
              const [mt, url, alt] = item.split("|");
              return (
                <li key={i} className="flex items-center justify-between gap-3 rounded-md bg-surface px-3 py-2 text-sm">
                  <span className="truncate">
                    <span className="font-medium text-foreground">{mt}</span>
                    <span className="text-muted-foreground"> · {url}</span>
                    {alt ? <span className="text-subtle-foreground"> · {alt}</span> : null}
                  </span>
                  <button type="button" aria-label="Remove media" className="text-muted-foreground hover:text-danger"
                    onClick={() => removeMedia(i)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/products" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Products
            </Link>
            <span className="text-lg font-bold text-foreground">{isEdit ? "Edit product" : "New product"}</span>
          </div>
          <Button type="submit" form="product-form" loading={saving} size="sm">
            <Save className="h-4 w-4" aria-hidden="true" /><span className="ml-1.5">Save</span>
          </Button>
        </Container>
      </header>
      <main className="py-8">
        <Container>
          {loading ? <Skeleton className="h-96 w-full" /> : (
            error ? <ErrorState title="Error" description={error} /> : (
              <form id="product-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
                {renderBasicInfo()}
                {renderPricing()}
                {renderContent()}
                {renderDelivery()}
                {renderSettings()}
                {renderSeo()}
                {renderMedia()}
              </form>
            )
          )}
        </Container>
      </main>
    </div>
  );
}