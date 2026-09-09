import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Checkbox } from "../components/ui/Checkbox";
import { FormField } from "../components/ui/FormField";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { useToast } from "../components/ui/useToast";
import {
  listCategories, createCategory, updateCategory, type Category,
} from "../lib/admin-api";

export function AdminCategoriesPage() {
  const { notify } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listCategories();
      setCategories(result.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchCategories(); }, [fetchCategories]);

  function resetForm() {
    setName(""); setSlug(""); setDescription(""); setIsActive(true); setSortOrder("0");
    setEditingId(null); setShowForm(false);
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name); setSlug(category.slug);
    setDescription(category.description ?? "");
    setIsActive(category.is_active); setSortOrder(String(category.sort_order));
    setShowForm(true);
  }

  function generateSlug(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!editingId && !slug) setSlug(generateSlug(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const payload = {
      name: name.trim(), slug: slug.trim(),
      description: description.trim() || null,
      is_active: isActive, sort_order: parseInt(sortOrder) || 0,
    };
    try {
      if (editingId) {
        await updateCategory(editingId, payload);
        notify("Category updated.");
      } else {
        await createCategory(payload);
        notify("Category created.");
      }
      resetForm();
      void fetchCategories();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
            <span className="text-lg font-bold text-foreground">Categories</span>
          </div>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4" aria-hidden="true" /><span className="ml-1.5">New category</span>
          </Button>
        </Container>
      </header>
      <main className="py-8">
        <Container>

          {showForm && (
            <Card className="mb-6 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {editingId ? "Edit category" : "New category"}
              </h2>
              <form onSubmit={handleSubmit} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Name" required>
                    {(f) => <Input {...f} value={name} onChange={(e) => handleNameChange(e.target.value)} required />}
                  </FormField>
                  <FormField label="Slug" required hint="Lowercase letters, numbers, hyphens">
                    {(f) => <Input {...f} value={slug} onChange={(e) => setSlug(e.target.value)} required />}
                  </FormField>
                </div>
                <FormField label="Description">
                  {(f) => <Textarea {...f} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />}
                </FormField>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
                  </label>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground">Order</span>
                    <Input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
                      className="w-24" aria-label="Sort order" />
                  </span>
                  <Button type="submit" loading={saving} size="sm"><Plus className="h-4 w-4" aria-hidden="true" /><span className="ml-1.5">Save</span></Button>
                  <Button type="button" variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          {error && <ErrorState title="Failed to load categories" description={error} onRetry={() => void fetchCategories()} />}
          {loading && !error && (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-16 w-full" />))}</div>
          )}
          {!loading && !error && categories.length === 0 && (
            <EmptyState title="No categories yet" description="Create categories to organize your products."
              action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" aria-hidden="true" /><span className="ml-1.5">New category</span></Button>}
            />
          )}
          {!loading && !error && categories.length > 0 && (
            <div className="space-y-3">
              {categories.map((category) => (
                <Card key={category.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{category.name}</span>
                      {category.is_active
                        ? <Badge variant="success">Active</Badge>
                        : <Badge variant="neutral">Inactive</Badge>}
                      <Badge variant="neutral">{category.sort_order}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-mono text-xs">{category.slug}</span>
                      {category.description ? ` · ${category.description}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => startEdit(category)} aria-label={`Edit ${category.name}`}>
                    <Pencil className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Edit</span>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}