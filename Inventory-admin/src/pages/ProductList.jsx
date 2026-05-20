import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
  Package, Filter, X, ArrowUpDown, CheckSquare, Square, RefreshCw,
  ToggleLeft, ToggleRight, Loader2, AlertTriangle
} from "lucide-react";

/* ─── Status badge ─────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    active:   { bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.25)", text: "#4ade80", dot: "#4ade80",   label: "Active"   },
    inactive: { bg: "var(--danger-soft)",   border: "var(--danger-border)", text: "var(--danger-text)", dot: "var(--danger-text)", label: "Inactive" },
    draft:    { bg: "rgba(148,163,184,0.1)",border: "rgba(148,163,184,0.2)",text: "var(--text-muted)",  dot: "var(--text-muted)",  label: "Draft"    },
  };
  const s = map[status] || map.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
};

/* ─── Confirm dialog ───────────────────────────────────────── */
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl" style={{ background: "var(--danger-soft)" }}>
            <AlertTriangle size={18} style={{ color: "var(--danger-text)" }} />
          </div>
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-sec)" }}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-sec)" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", color: "var(--danger-text)" }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── View popup modal ─────────────────────────────────────── */
const ViewModal = ({ product, onClose, navigate }) => {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg" style={{ background: "var(--accent-soft)" }}>
              <Package size={15} style={{ color: "var(--accent-text)" }} />
            </div>
            <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Product Details</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-all"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--danger-border)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            <X size={15} style={{ color: "var(--text-sec)" }} />
          </button>
        </div>

        <div className="p-6">
          {/* Top section: image + core info side by side */}
          <div className="flex flex-col sm:flex-row gap-5 mb-6">
            {/* Image */}
            <div className="w-full sm:w-48 flex-shrink-0">
              {product.images?.[0] ? (
                <img src={product.images[0].url} alt={product.name}
                  className="w-full aspect-square object-cover rounded-2xl"
                  style={{ border: "1px solid var(--border)" }} />
              ) : (
                <div className="w-full aspect-square rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                  <Package size={32} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
              {/* Extra thumbnails */}
              {product.images?.length > 1 && (
                <div className="flex gap-1.5 mt-2">
                  {product.images.slice(1, 4).map((img, i) => (
                    <img key={i} src={img.url} alt=""
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                      style={{ border: "1px solid var(--border)" }} />
                  ))}
                  {product.images.length > 4 && (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                      +{product.images.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Core info */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-lg leading-snug" style={{ color: "var(--text-primary)" }}>{product.name}</h3>
                <StatusBadge status={product.status} />
              </div>
              {product.sku && (
                <span className="text-xs font-mono px-2 py-1 rounded-lg w-fit"
                  style={{ background: "var(--bg-surface)", color: "var(--text-muted)", border: "1px solid var(--border-sub)" }}>
                  SKU: {product.sku}
                </span>
              )}

              {/* Price block */}
              <div className="flex items-end gap-3 mt-1">
                <span className="text-3xl font-bold" style={{ color: "var(--accent-text)" }}>
                  ₹{product.price?.toLocaleString()}
                </span>
                {product.comparePrice && (
                  <>
                    <span className="text-base line-through mb-0.5" style={{ color: "var(--text-muted)" }}>
                      ₹{product.comparePrice?.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg mb-0.5"
                      style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}>
                      {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full"
                  style={{ background: product.quantity === 0 ? "var(--danger-text)" : product.quantity < 10 ? "#fb923c" : "#4ade80" }} />
                <span className="text-sm font-medium"
                  style={{ color: product.quantity === 0 ? "var(--danger-text)" : product.quantity < 10 ? "#fb923c" : "var(--text-primary)" }}>
                  {product.quantity === 0 ? "Out of stock" : `${product.quantity} ${product.unit || "units"} in stock`}
                  {product.quantity > 0 && product.quantity < 10 ? " (Low)" : ""}
                </span>
              </div>

              {/* Tags */}
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {product.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-lg text-xs"
                      style={{ background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid var(--accent-border)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Category",  value: product.category      },
              { label: "Brand",     value: product.brand || "—"  },
              { label: "Weight",    value: product.weight ? `${product.weight}g` : "—" },
              { label: "Featured",  value: product.isFeatured ? "✓ Yes" : "No" },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl text-center"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-sub)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
                <p className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-5 p-4 rounded-xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-sub)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Description</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-sec)" }}>{product.description}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4"
            style={{ borderTop: "1px solid var(--border-sub)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Added {new Date(product.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <div className="flex gap-2">
              <button onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-sec)" }}>
                Close
              </button>
              <button onClick={() => { onClose(); navigate(`/admin/editproduct/${product._id}`); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "var(--accent)", color: "#fff" }}>
                <Pencil size={13} /> Edit Product
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const CATEGORIES = ["Electronics","Clothing","Footwear","Home & Living","Beauty","Sports","Books","Toys","Food","Accessories","Other"];

const API = import.meta.env.VITE_API_URL;   // Vite proxy forwards this to http://localhost:5000

export default function ProductList() {
  const navigate = useNavigate();

  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [selected,   setSelected]   = useState(new Set());

  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("");
  const [status,   setStatus]   = useState("");
  const [sort,     setSort]     = useState("-createdAt");

  const [viewProduct,   setViewProduct]   = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(null);

  /* ── fetch ───────────────────────────────────────────────── */
  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, sort });
      if (search)   params.set("search",   search);
      if (category) params.set("category", category);
      if (status)   params.set("status",   status);

      const res  = await fetch(`${API}/products?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, status, sort]);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  /* ── delete ──────────────────────────────────────────────── */
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await fetch(`${API}/products/${deleteTarget._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setDeleteTarget(null);
      fetchProducts(pagination.page);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── bulk delete ─────────────────────────────────────────── */
  const handleBulkDelete = async () => {
    if (!selected.size) return;
    try {
      await fetch(`${API}/products/bulk-delete`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      setSelected(new Set());
      fetchProducts(1);
    } catch (err) {
      console.error(err);
    }
  };

  /* ── status toggle ───────────────────────────────────────── */
  const handleStatusToggle = async (product) => {
    const next = product.status === "active" ? "inactive" : "active";
    setStatusLoading(product._id);
    try {
      const res  = await fetch(`${API}/products/${product._id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map(p => p._id === product._id ? data.data : p));
      }
    } finally {
      setStatusLoading(null);
    }
  };

  /* ── selection ───────────────────────────────────────────── */
  const toggleSelect    = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected(s => s.size === products.length ? new Set() : new Set(products.map(p => p._id)));

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Products</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {pagination.total} product{pagination.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <button onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", color: "var(--danger-text)" }}>
              <Trash2 size={14} /> Delete {selected.size} selected
            </button>
          )}
          <button onClick={() => navigate("/admin/addproduct")}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }} />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            placeholder="Search products…"
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={e => { e.target.style.borderColor = "var(--accent-border)"; }}
            onBlur={e  => { e.target.style.borderColor = "var(--border)"; }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={13} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </div>

        {/* Category */}
        <select className="px-3 py-2.5 rounded-xl text-sm outline-none appearance-none min-w-[140px]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: category ? "var(--text-primary)" : "var(--text-muted)" }}
          value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Status */}
        <select className="px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: status ? "var(--text-primary)" : "var(--text-muted)" }}
          value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>

        {/* Sort */}
        <select className="px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          value={sort} onChange={e => setSort(e.target.value)}>
          <option value="-createdAt">Newest First</option>
          <option value="createdAt">Oldest First</option>
          <option value="price">Price: Low → High</option>
          <option value="-price">Price: High → Low</option>
          <option value="name">Name A–Z</option>
          <option value="-name">Name Z–A</option>
          <option value="quantity">Stock: Low → High</option>
        </select>

        {/* Refresh */}
        <button onClick={() => fetchProducts(pagination.page)}
          className="p-2.5 rounded-xl transition-all"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <RefreshCw size={14} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      {/* Table wrapper */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="p-4 rounded-2xl" style={{ background: "var(--bg-elevated)" }}>
              <Package size={28} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>No products found</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Try adjusting your filters or add a new product</p>
            <button onClick={() => navigate("/admin/addproduct")}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}>
              <Plus size={15} /> Add First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="w-10 px-4 py-3 text-left">
                    <button onClick={toggleSelectAll} className="flex items-center">
                      {selected.size === products.length && products.length > 0
                        ? <CheckSquare size={15} style={{ color: "var(--accent)" }} />
                        : <Square size={15} style={{ color: "var(--text-muted)" }} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-widest uppercase hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Price</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-widest uppercase hidden md:table-cell" style={{ color: "var(--text-muted)" }}>Stock</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => (
                  <tr key={product._id}
                    className="transition-all"
                    style={{
                      borderBottom: idx < products.length - 1 ? "1px solid var(--border-sub)" : "none",
                      background: selected.has(product._id) ? "var(--accent-soft)" : "transparent",
                    }}
                    onMouseEnter={e => { if (!selected.has(product._id)) e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = selected.has(product._id) ? "var(--accent-soft)" : "transparent"; }}>

                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(product._id)}>
                        {selected.has(product._id)
                          ? <CheckSquare size={15} style={{ color: "var(--accent)" }} />
                          : <Square size={15} style={{ color: "var(--text-muted)" }} />}
                      </button>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img src={product.images[0].url} alt={product.name}
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                            style={{ border: "1px solid var(--border)" }} />
                        ) : (
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                            <Package size={14} style={{ color: "var(--text-muted)" }} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate max-w-[160px]" style={{ color: "var(--text-primary)" }}>{product.name}</p>
                          {product.sku && <p className="text-xs font-mono truncate" style={{ color: "var(--text-muted)" }}>{product.sku}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--bg-elevated)", color: "var(--text-sec)" }}>
                        {product.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>₹{product.price?.toLocaleString()}</p>
                      {product.comparePrice && (
                        <p className="text-xs line-through" style={{ color: "var(--text-muted)" }}>₹{product.comparePrice?.toLocaleString()}</p>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-sm font-medium`}
                        style={{ color: product.quantity === 0 ? "var(--danger-text)" : product.quantity < 10 ? "#fb923c" : "var(--text-primary)" }}>
                        {product.quantity}
                        {product.quantity === 0 && <span className="ml-1 text-xs">(Out)</span>}
                        {product.quantity > 0 && product.quantity < 10 && <span className="ml-1 text-xs">(Low)</span>}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <ActionBtn onClick={() => setViewProduct(product)} title="View">
                          <Eye size={14} />
                        </ActionBtn>

                        {/* Edit */}
                        <ActionBtn onClick={() => navigate(`/admin/editproduct/${product._id}`)} title="Edit" accent>
                          <Pencil size={14} />
                        </ActionBtn>

                        {/* Toggle active/inactive */}
                        <ActionBtn
                          onClick={() => handleStatusToggle(product)}
                          title={product.status === "active" ? "Deactivate" : "Activate"}
                          loading={statusLoading === product._id}>
                          {product.status === "active"
                            ? <ToggleRight size={14} style={{ color: "#4ade80" }} />
                            : <ToggleLeft size={14} style={{ color: "var(--text-muted)" }} />}
                        </ActionBtn>

                        {/* Delete */}
                        <ActionBtn onClick={() => setDeleteTarget(product)} title="Delete" danger>
                          <Trash2 size={14} />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && products.length > 0 && (
          <div className="flex items-center justify-between px-4 py-4"
            style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Showing {(pagination.page - 1) * 10 + 1}–{Math.min(pagination.page * 10, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <PagBtn onClick={() => fetchProducts(pagination.page - 1)} disabled={pagination.page <= 1}>
                <ChevronLeft size={14} />
              </PagBtn>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let p = i + 1;
                if (pagination.totalPages > 5) {
                  const start = Math.max(1, pagination.page - 2);
                  p = start + i;
                  if (p > pagination.totalPages) return null;
                }
                return (
                  <PagBtn key={p} onClick={() => fetchProducts(p)} active={p === pagination.page}>
                    {p}
                  </PagBtn>
                );
              })}
              <PagBtn onClick={() => fetchProducts(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                <ChevronRight size={14} />
              </PagBtn>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ViewModal product={viewProduct} onClose={() => setViewProduct(null)} navigate={navigate} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}

/* ─── small button helpers ─────────────────────────────────── */
function ActionBtn({ children, onClick, title, danger, accent, loading }) {
  return (
    <button onClick={onClick} title={title} disabled={loading}
      className="p-2 rounded-lg transition-all disabled:opacity-50"
      style={{
        background: danger ? "var(--danger-soft)" : accent ? "var(--accent-soft)" : "var(--bg-elevated)",
        border:     `1px solid ${danger ? "var(--danger-border)" : accent ? "var(--accent-border)" : "var(--border)"}`,
        color:      danger ? "var(--danger-text)" : accent ? "var(--accent-text)" : "var(--text-sec)",
      }}
      onMouseEnter={e => { if (!danger && !accent) e.currentTarget.style.borderColor = "var(--accent-border)"; }}
      onMouseLeave={e => { if (!danger && !accent) e.currentTarget.style.borderColor = "var(--border)"; }}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : children}
    </button>
  );
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-8 h-8 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
      style={{
        background: active ? "var(--accent)" : "var(--bg-surface)",
        border:     `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
        color:      active ? "#fff" : "var(--text-sec)",
      }}>
      {children}
    </button>
  );
}
