import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Archive, Edit3, Plus, Power, PowerOff, Search } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { useToast } from "../components/ui/useToast";
import {
  listProducts,
  updateProductStatus,
  type Product,
} from "../lib/admin-api";
import { formatMoney } from "../lib/money";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

export function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { notify } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const page = Number(searchParams.get("page") ?? "1") || 1;
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";
  const statusFilter: "active" | "inactive" | "archived" | undefined =
    status === "active" || status === "inactive" || status === "archived"
      ? status
      : undefined;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listProducts({
        page, perPage: 20, status: statusFilter,
        search: search || undefined, sort: "updated", order: "desc",
      });
      setProducts(result.products);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  function updateParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    if (key !== "page") p.delete("page");
    setSearchParams(p);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", searchInput.trim());
  }

  async function handleStatusChange(product: Product, newStatus: "active" | "inactive" | "archived") {
    try {
      await updateProductStatus(product.id, newStatus);
      notify(`Product ${newStatus === "archived" ? "archived" : newStatus}.`);
      void fetchProducts();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Action failed.");
    }
  }

  function statusBadge(status: Product["status"]) {
    if (status === "active") return <Badge variant="success">Active</Badge>;
    if (status === "inactive") return <Badge variant="warning">Inactive</Badge>;
    return <Badge variant="neutral">Archived</Badge>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
            <span className="text-lg font-bold text-foreground">Products</span>
          </div>
          <Link to="/admin/products/new">
            <Button size="sm"><Plus className="h-4 w-4" aria-hidden="true" /><span className="ml-1.5">New product</span></Button>
          </Link>
        </Container>
      </header>
      <main className="py-8">
        <Container>
          <Card className="mb-6 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input type="search" placeholder="Search products..." value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
                  </div>
                  <Button type="submit" variant="outline">Search</Button>
                </div>
              </form>
              <div className="w-full sm:w-48">
                <Select value={status} onChange={(e) => updateParam("status", e.target.value)} aria-label="Filter by status">
                  {STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </Select>
              </div>
            </div>
          </Card>
          {error && (<ErrorState title="Failed to load products" description={error} onRetry={() => void fetchProducts()} />)}
          {loading && !error && (<div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-20 w-full" />))}</div>)}
          {!loading && !error && products.length === 0 && (
            <EmptyState title="No products found"
              description={search || status ? "Try adjusting your filters." : "Get started by creating your first product."}
              action={!search && !status ? (<Link to="/admin/products/new"><Button><Plus className="h-4 w-4" aria-hidden="true" /><span className="ml-1.5">New product</span></Button></Link>) : undefined}
            />
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div className="space-y-3">
                {products.map((product) => (
                  <Card key={product.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-foreground">{product.name}</h3>
                        {statusBadge(product.status)}
                        {product.is_featured && <Badge variant="primary">Featured</Badge>}
                        {product.is_best_seller && <Badge variant="success">Best seller</Badge>}
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{product.short_description}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatMoney({ amountMinor: product.price_minor, currency: product.currency })}
                        {product.compare_at_price_minor ? (
                          <span className="ml-2 text-sm font-normal text-subtle-foreground line-through">
                            {formatMoney({ amountMinor: product.compare_at_price_minor, currency: product.currency })}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {product.status === "active" ? (
                        <Button size="sm" variant="outline" title="Deactivate"
                          onClick={() => void handleStatusChange(product, "inactive")}>
                          <PowerOff className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Deactivate</span>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" title="Activate"
                          onClick={() => void handleStatusChange(product, "active")}>
                          <Power className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Activate</span>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" title="Archive"
                        onClick={() => void handleStatusChange(product, "archived")}>
                        <Archive className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Archive</span>
                      </Button>
                      <Link to={`/admin/products/${product.id}/edit`}>
                        <Button size="sm" variant="outline" title="Edit">
                          <Edit3 className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Edit</span>
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1}
                      onClick={() => updateParam("page", String(page - 1))}>
                      ←<span className="sr-only">Previous page</span>
                    </Button>
                    <Button size="sm" variant="outline" disabled={page >= pagination.totalPages}
                      onClick={() => updateParam("page", String(page + 1))}>
                      →<span className="sr-only">Next page</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Container>
      </main>
    </div>
  );
}
