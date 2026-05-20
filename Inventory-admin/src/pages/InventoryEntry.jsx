import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Package,
  RefreshCw,
  Save,
  Search,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api, { getApiError } from "../lib/api";

/* ─── Small reusable pieces ──────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = {
    active: {
      bg: "rgba(74,222,128,0.1)",
      border: "rgba(74,222,128,0.25)",
      text: "#4ade80",
    },
    inactive: {
      bg: "var(--danger-soft)",
      border: "var(--danger-border)",
      text: "var(--danger-text)",
    },
    draft: {
      bg: "rgba(234,179,8,0.1)",
      border: "rgba(234,179,8,0.25)",
      text: "#eab308",
    },
  };
  const c = cfg[status] || cfg.draft;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold capitalize"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: c.text }}
      />
      {status}
    </span>
  );
};

/* ─── Inline stock editor ─────────────────────────────────── */
function StockEditor({ product, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [newQty, setNewQty] = useState(product.quantity);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (newQty === "" || isNaN(Number(newQty))) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/products/${product._id}/stock`, {
        quantity: Number(newQty),
        notes,
      });
      if (!data.success) throw new Error(data.message);
      setSuccess(true);
      setEditing(false);
      setNotes("");
      onSaved(data.data);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      alert(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const diff = Number(newQty) - product.quantity;

  return (
    <div className="flex items-center gap-2 justify-end">
      {editing ? (
        <>
          <input
            type="number"
            min="0"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            className="w-20 rounded-lg px-2 py-1.5 text-sm font-bold text-center outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--accent-border)",
              color: "var(--text-primary)",
              boxShadow: "0 0 0 3px var(--accent-soft)",
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setEditing(false);
            }}
          />
          {diff !== 0 && (
            <span
              className="text-xs font-bold flex items-center gap-0.5"
              style={{ color: diff > 0 ? "#4ade80" : "var(--danger-text)" }}
            >
              {diff > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {diff > 0 ? `+${diff}` : diff}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {saving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Save size={12} />
            )}
            Save
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setNewQty(product.quantity);
            }}
            className="px-2 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-sec)",
            }}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          {success && (
            <span
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: "#4ade80" }}
            >
              <CheckCircle size={12} /> Saved
            </span>
          )}
          <span
            className="px-3 py-1 rounded-lg text-sm font-bold"
            style={{
              background:
                product.quantity === 0
                  ? "var(--danger-soft)"
                  : "rgba(74,222,128,0.1)",
              color: product.quantity === 0 ? "var(--danger-text)" : "#4ade80",
              border: `1px solid ${product.quantity === 0 ? "var(--danger-border)" : "rgba(74,222,128,0.25)"}`,
            }}
          >
            {product.quantity}
          </span>
          <button
            onClick={() => {
              setEditing(true);
              setNewQty(product.quantity);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
              color: "var(--accent-text)",
            }}
          >
            Update
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────── */
export default function InventoryEntry() {
  useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", {
        params: { limit: 100, status: "active" },
      });
      if (!data.success) throw new Error(data.message);
      setProducts(data.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSaved = (updated) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === updated._id ? updated : p)),
    );
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalQty = products.reduce((s, p) => s + p.quantity, 0);
  const outOfStock = products.filter((p) => p.quantity === 0).length;
  const lowStock = products.filter(
    (p) => p.quantity > 0 && p.quantity <= 5,
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Inventory Entry
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Update daily stock quantities for shop products
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-sec)",
          }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          ["Total Products", products.length, Warehouse, null],
          [
            "Out of Stock",
            outOfStock,
            AlertTriangle,
            { bg: "var(--danger-soft)", text: "var(--danger-text)" },
          ],
          [
            "Low Stock (≤5)",
            lowStock,
            TrendingDown,
            { bg: "rgba(234,179,8,0.1)", text: "#eab308" },
          ],
        ].map(([label, value, Icon, color]) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  {label}
                </p>
                <p
                  className="text-2xl font-black mt-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {value}
                </p>
              </div>
              <div
                className="p-2 rounded-xl"
                style={{ background: color?.bg || "var(--accent-soft)" }}
              >
                <Icon
                  size={18}
                  style={{ color: color?.text || "var(--accent-text)" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
          placeholder="Search by name, category, SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid var(--danger-border)",
            color: "var(--danger-text)",
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Info bar */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <p
            className="text-xs font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Click{" "}
            <strong style={{ color: "var(--accent-text)" }}>Update</strong> next
            to any product to change its stock
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: "var(--accent)" }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Package size={28} style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-primary)" }}>No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[
                    "Product",
                    "Category",
                    "Status",
                    "Current Stock",
                    "Update Stock",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 font-semibold text-xs tracking-widest uppercase ${h === "Update Stock" ? "text-right" : "text-left"}`}
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, idx) => (
                  <tr
                    key={product._id}
                    style={{
                      borderBottom:
                        idx < filtered.length - 1
                          ? "1px solid var(--border-sub)"
                          : "none",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                          style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {product.images?.[0]?.url ? (
                            <img
                              src={product.images[0].url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package
                              size={14}
                              style={{ color: "var(--text-muted)" }}
                            />
                          )}
                        </div>
                        <div>
                          <p
                            className="font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {product.name}
                          </p>
                          <p
                            className="text-xs font-mono"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {product.sku || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--text-sec)" }}
                    >
                      {product.category}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-bold text-sm"
                        style={{
                          color:
                            product.quantity === 0
                              ? "var(--danger-text)"
                              : product.quantity <= 5
                                ? "#eab308"
                                : "var(--text-primary)",
                        }}
                      >
                        {product.quantity}
                        {product.quantity === 0 && (
                          <span
                            className="ml-1.5 text-xs font-normal"
                            style={{ color: "var(--danger-text)" }}
                          >
                            Out of stock
                          </span>
                        )}
                        {product.quantity > 0 && product.quantity <= 5 && (
                          <span
                            className="ml-1.5 text-xs font-normal"
                            style={{ color: "#eab308" }}
                          >
                            Low
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StockEditor product={product} onSaved={handleSaved} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
