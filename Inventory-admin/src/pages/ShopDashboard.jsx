import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardList,
  Loader2,
  Package,
  Plus,
  ShoppingCart,
  Store,
  TrendingDown,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api, { getApiError } from "../lib/api";

const StatCard = ({ label, value, icon: Icon, tone = "accent" }) => {
  const colors = {
    accent: { bg: "var(--accent-soft)", text: "var(--accent-text)" },
    danger: { bg: "var(--danger-soft)", text: "var(--danger-text)" },
    warning: { bg: "rgba(234,179,8,0.1)", text: "#eab308" },
    success: { bg: "rgba(74,222,128,0.1)", text: "#4ade80" },
  };
  const color = colors[tone] || colors.accent;

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-xs font-semibold uppercase tracking-widest truncate"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </p>
          <p
            className="text-2xl font-black mt-1 truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </p>
        </div>
        <div className="p-2 rounded-xl shrink-0" style={{ background: color.bg }}>
          <Icon size={18} style={{ color: color.text }} />
        </div>
      </div>
    </div>
  );
};

export default function ShopDashboard() {
  useTheme();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [productStats, setProductStats] = useState({});
  const [orderStats, setOrderStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [shopRes, productsRes, productStatsRes, orderStatsRes] =
          await Promise.all([
            api.get("/shops/my-shop"),
            api.get("/products", { params: { page: 1, limit: 8, sort: "-createdAt" } }),
            api.get("/products/stats"),
            api.get("/orders/stats"),
          ]);

        if (!shopRes.data.success) throw new Error(shopRes.data.message);
        if (!productsRes.data.success) throw new Error(productsRes.data.message);

        setShop(shopRes.data.data);
        setProducts(productsRes.data.data || []);
        setProductStats(productStatsRes.data.data || {});
        setOrderStats(orderStatsRes.data.data || {});
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const recommendations = useMemo(() => {
    const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= 5);
    const outOfStock = products.filter((p) => p.quantity === 0);
    const drafts = Number(productStats.draft || 0);
    const items = [];

    if (outOfStock.length) {
      items.push({
        title: "Restock unavailable products",
        detail: `${outOfStock.length} product${outOfStock.length === 1 ? "" : "s"} are out of stock.`,
        icon: AlertTriangle,
        tone: "danger",
      });
    }
    if (lowStock.length) {
      items.push({
        title: "Review low stock",
        detail: `${lowStock.length} product${lowStock.length === 1 ? "" : "s"} are at 5 units or less.`,
        icon: TrendingDown,
        tone: "warning",
      });
    }
    if (drafts) {
      items.push({
        title: "Publish ready drafts",
        detail: `${drafts} draft product${drafts === 1 ? "" : "s"} can be completed.`,
        icon: ClipboardList,
        tone: "accent",
      });
    }
    if (!items.length) {
      items.push({
        title: "Inventory looks healthy",
        detail: "Keep adding products and checking stock before peak hours.",
        icon: Package,
        tone: "success",
      });
    }

    return items.slice(0, 3);
  }, [products, productStats.draft]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-sm" style={{ color: "var(--danger-text)" }}>
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {shop?.name}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {shop?.code} | {shop?.city || "Shop"} inventory and order overview
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/admin/addproduct")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Plus size={14} /> Add Product
          </button>
          <button
            onClick={() => navigate("/admin/products")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-sec)",
            }}
          >
            <Package size={14} /> Products
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Products" value={productStats.total || 0} icon={Package} />
        <StatCard
          label="Total Stock"
          value={productStats.totalQty || 0}
          icon={Store}
          tone="success"
        />
        <StatCard
          label="Out of Stock"
          value={productStats.outOfStock || 0}
          icon={AlertTriangle}
          tone={productStats.outOfStock ? "danger" : "success"}
        />
        <StatCard
          label="Revenue"
          value={`Rs ${(orderStats.revenue || 0).toLocaleString()}`}
          icon={Wallet}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Recent Products
            </p>
            <button
              onClick={() => navigate("/admin/products")}
              className="text-xs font-semibold"
              style={{ color: "var(--accent-text)" }}
            >
              View all
            </button>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center">
              <Package size={28} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p style={{ color: "var(--text-primary)" }}>No products added yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Product", "Category", "Stock", "Price", "Status"].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left font-semibold text-xs tracking-widest uppercase"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, idx) => (
                    <tr
                      key={product._id}
                      style={{
                        borderBottom:
                          idx < products.length - 1 ? "1px solid var(--border-sub)" : "none",
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
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
                              <Package size={14} style={{ color: "var(--text-muted)" }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate max-w-[180px]" style={{ color: "var(--text-primary)" }}>
                              {product.name}
                            </p>
                            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                              {product.sku || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-sec)" }}>
                        {product.category || "-"}
                      </td>
                      <td
                        className="px-4 py-3 font-semibold"
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
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: "var(--accent-text)" }}>
                        Rs {(product.price || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded-lg text-xs font-semibold capitalize"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-sec)",
                            border: "1px solid var(--border-sub)",
                          }}
                        >
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Recommended
            </p>
            <div className="space-y-3">
              {recommendations.map((item) => {
                const Icon = item.icon;
                const tone =
                  item.tone === "danger"
                    ? { bg: "var(--danger-soft)", text: "var(--danger-text)" }
                    : item.tone === "warning"
                      ? { bg: "rgba(234,179,8,0.1)", text: "#eab308" }
                      : item.tone === "success"
                        ? { bg: "rgba(74,222,128,0.1)", text: "#4ade80" }
                        : { bg: "var(--accent-soft)", text: "var(--accent-text)" };

                return (
                  <div key={item.title} className="flex gap-3">
                    <div className="p-2 rounded-xl h-fit" style={{ background: tone.bg }}>
                      <Icon size={15} style={{ color: tone.text }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {item.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Shop Snapshot
            </p>
            {[
              ["Owner", shop?.ownerName || "-", User],
              ["Orders", orderStats.total || 0, ShoppingCart],
              ["Pending Orders", orderStats.pending || 0, ClipboardList],
              ["Staff", "Manage", Users],
            ].map(([label, value, Icon]) => (
              <div
                key={label}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: label === "Staff" ? "none" : "1px solid var(--border-sub)" }}
              >
                <span className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Icon size={13} /> {label}
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {value}
                </span>
              </div>
            ))}
            <button
              onClick={() => navigate("/admin/staff")}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid var(--accent-border)" }}
            >
              <Users size={14} /> Manage Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
