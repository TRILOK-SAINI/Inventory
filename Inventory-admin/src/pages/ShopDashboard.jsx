import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardList,
  Loader2,
  Package,
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
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
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
        <div
          className="p-2 rounded-xl shrink-0"
          style={{ background: color.bg }}
        >
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
  const [orderStats, setOrderStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // /shops/my-shop already returns products populated — no need to call /products
        const [shopRes, orderStatsRes] = await Promise.all([
          api.get("/shops/my-shop"),
          api.get("/orders/stats"),
        ]);

        if (!shopRes.data.success) throw new Error(shopRes.data.message);
        setShop(shopRes.data.data);
        setOrderStats(orderStatsRes.data.data || {});
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derive product stats purely from the shop's assigned products array
  const productStats = useMemo(() => {
    if (!shop) return { total: 0, totalQty: 0, outOfStock: 0 };
    const assigned = shop.products || [];
    const total = assigned.length;
    const totalQty = assigned.reduce(
      (sum, item) => sum + Number(item.product?.quantity || 0),
      0,
    );
    const outOfStock = assigned.filter(
      (item) => Number(item.product?.quantity || 0) <= 0,
    ).length;
    return { total, totalQty, outOfStock };
  }, [shop]);

  // Smart recommendations based on assigned product state
  const recommendations = useMemo(() => {
    if (!shop) return [];
    const assigned = shop.products || [];
    const outOfStock = assigned.filter(
      (item) => Number(item.product?.quantity || 0) <= 0,
    );
    const lowStock = assigned.filter(
      (item) =>
        Number(item.product?.quantity || 0) > 0 &&
        Number(item.product?.quantity || 0) <= 5,
    );
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
    if (!items.length) {
      items.push({
        title: "Inventory looks healthy",
        detail: "All assigned products have sufficient stock.",
        icon: Package,
        tone: "success",
      });
    }

    return items.slice(0, 3);
  }, [shop]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "var(--accent)" }}
        />
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

  // Use the most recent 8 assigned products for the table
  const recentProducts = (shop?.products || []).slice(0, 8);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {shop?.name}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {shop?.code} | {shop?.city || "Shop"} — inventory and order overview
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/admin/orders")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <ShoppingCart size={14} /> New Order
          </button>
          <button
            onClick={() => navigate("/admin/orders")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-sec)",
            }}
          >
            <ClipboardList size={14} /> View Orders
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Products" value={productStats.total} icon={Package} />
        <StatCard
          label="Total Stock"
          value={productStats.totalQty}
          icon={Store}
          tone="success"
        />
        <StatCard
          label="Out of Stock"
          value={productStats.outOfStock}
          icon={AlertTriangle}
          tone={productStats.outOfStock ? "danger" : "success"}
        />
        <StatCard
          label="Revenue"
          value={`Rs ${(orderStats.revenue || 0).toLocaleString()}`}
          icon={Wallet}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Assigned products table */}
        <div
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Assigned Products
            </p>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-xs font-semibold"
              style={{ color: "var(--accent-text)" }}
            >
              Sell products →
            </button>
          </div>

          {recentProducts.length === 0 ? (
            <div className="py-16 text-center">
              <Package
                size={28}
                className="mx-auto mb-3"
                style={{ color: "var(--text-muted)" }}
              />
              <p style={{ color: "var(--text-primary)" }}>
                No products assigned yet.
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Ask the super admin to assign products to your shop.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {[
                      "Product",
                      "Category",
                      "Stock",
                      "Price",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-semibold text-xs tracking-widest uppercase"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.map((item, idx) => (
                    <tr
                      key={item.product?._id || idx}
                      style={{
                        borderBottom:
                          idx < recentProducts.length - 1
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
                            {item.product?.images?.[0]?.url ? (
                              <img
                                src={item.product.images[0].url}
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
                          <div className="min-w-0">
                            <p
                              className="font-semibold truncate max-w-40"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {item.product?.name || "Product"}
                            </p>
                            <p
                              className="text-xs font-mono"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {item.product?.sku || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: "var(--text-sec)" }}
                      >
                        {item.product?.category || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{
                            background:
                              Number(item.product?.quantity || 0) === 0
                                ? "var(--danger-soft)"
                                : "rgba(74,222,128,0.1)",
                            color:
                              Number(item.product?.quantity || 0) === 0
                                ? "var(--danger-text)"
                                : "#4ade80",
                            border: `1px solid ${Number(item.product?.quantity || 0) === 0 ? "var(--danger-border)" : "rgba(74,222,128,0.25)"}`,
                          }}
                        >
                          {item.product?.quantity || 0}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 font-semibold"
                        style={{ color: "var(--accent-text)" }}
                      >
                        Rs{" "}
                        {(
                          item.product?.price ||
                          0
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Recommendations */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Recommendations
            </p>
            <div className="space-y-3">
              {recommendations.map((item) => {
                const Icon = item.icon;
                const toneMap = {
                  danger: {
                    bg: "var(--danger-soft)",
                    text: "var(--danger-text)",
                  },
                  warning: { bg: "rgba(234,179,8,0.1)", text: "#eab308" },
                  success: { bg: "rgba(74,222,128,0.1)", text: "#4ade80" },
                  accent: {
                    bg: "var(--accent-soft)",
                    text: "var(--accent-text)",
                  },
                };
                const tone = toneMap[item.tone] || toneMap.accent;
                return (
                  <div key={item.title} className="flex gap-3">
                    <div
                      className="p-2 rounded-xl h-fit"
                      style={{ background: tone.bg }}
                    >
                      <Icon size={15} style={{ color: tone.text }} />
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.title}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shop snapshot */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Shop Snapshot
            </p>
            {[
              ["Owner", shop?.ownerName || "-", User],
              ["Orders", orderStats.total || 0, ShoppingCart],
              ["Pending", orderStats.pending || 0, ClipboardList],
              ["Staff", "Manage →", Users],
            ].map(([label, value, Icon]) => (
              <div
                key={label}
                className="flex items-center justify-between py-2"
                style={{
                  borderBottom:
                    label === "Staff" ? "none" : "1px solid var(--border-sub)",
                }}
              >
                <span
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Icon size={13} /> {label}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {value}
                </span>
              </div>
            ))}
            <button
              onClick={() => navigate("/admin/staff")}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent-text)",
                border: "1px solid var(--accent-border)",
              }}
            >
              <Users size={14} /> Manage Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
