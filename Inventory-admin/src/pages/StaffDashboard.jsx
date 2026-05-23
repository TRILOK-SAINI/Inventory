import { useEffect, useState } from "react";
import {
  CheckCircle,
  ClipboardList,
  Clock,
  Loader2,
  Package,
  ShoppingCart,
  Store,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import api, { getApiError } from "../lib/api";

const StatCard = ({ label, value, icon: Icon, color, onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl p-5 ${onClick ? "cursor-pointer hover:scale-[1.02] transition-transform" : ""}`}
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
          className="text-3xl font-black mt-1"
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </p>
      </div>
      <div
        className="p-3 rounded-xl"
        style={{ background: color?.bg || "var(--accent-soft)" }}
      >
        <Icon
          size={22}
          style={{ color: color?.text || "var(--accent-text)" }}
        />
      </div>
    </div>
  </div>
);

const mapShopProducts = (shopData) =>
  (shopData?.products || [])
    .filter((item) => item.product)
    .map((item) => item.product)
    .filter((product) => product.status === "active")
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .slice(0, 6);

export default function StaffDashboard() {
  useTheme();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [shopRes, statsRes] = await Promise.all([
          api.get("/shops/my-shop"),
          api.get("/orders/stats"),
        ]);
        if (shopRes.data.success) {
          setShop(shopRes.data.data);
          setProducts(mapShopProducts(shopRes.data.data));
        }
        if (statsRes.data.success) setStats(statsRes.data.data);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl"
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
            }}
          >
            <Store size={18} style={{ color: "var(--accent-text)" }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {shop?.name || "Staff Dashboard"}
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Welcome — here's your overview for today
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/admin/orders")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <ShoppingCart size={14} /> Orders
          </button>
          {/* <button
            onClick={() => navigate("/admin/orders")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-sec)",
            }}
          >
            <ShoppingCart size={14} /> Orders
          </button> */}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <StatCard
            label="Total Orders"
            value={stats.total}
            icon={ClipboardList}
            onClick={() => navigate("/admin/orders")}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock}
            color={{ bg: "rgba(234,179,8,0.1)", text: "#eab308" }}
            onClick={() => navigate("/admin/orders")}
          />
          <StatCard
            label="Delivered"
            value={stats.delivered}
            icon={CheckCircle}
            color={{ bg: "rgba(74,222,128,0.1)", text: "#4ade80" }}
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            icon={XCircle}
            color={{ bg: "var(--danger-soft)", text: "var(--danger-text)" }}
          />
          <StatCard
            label="Revenue"
            value={`Rs ${(stats.revenue || 0).toLocaleString()}`}
            icon={TrendingUp}
            color={{ bg: "rgba(14,165,233,0.12)", text: "var(--accent-text)" }}
          />
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/orders")}
          className="rounded-2xl p-5 text-left transition-all hover:scale-[1.01]"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-border)",
              }}
            >
              <ClipboardList
                size={18}
                style={{ color: "var(--accent-text)" }}
              />
            </div>
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
              Orders
            </h3>
          </div>
          <p className="text-sm" style={{ color: "var(--text-sec)" }}>
            Take new orders, mark deliveries, and cancel if needed.
          </p>
          <p
            className="text-xs mt-2 font-semibold"
            style={{ color: "var(--accent-text)" }}
          >
            Go to Orders →
          </p>
        </button>

        <button
          onClick={() => navigate("/admin/orders")}
          className="rounded-2xl p-5 text-left transition-all hover:scale-[1.01]"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.25)",
              }}
            >
              <ShoppingCart size={18} style={{ color: "#eab308" }} />
            </div>
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
              Assigned Products
            </h3>
          </div>
          <p className="text-sm" style={{ color: "var(--text-sec)" }}>
            Review assigned stock while creating customer orders.
          </p>
          <p
            className="text-xs mt-2 font-semibold"
            style={{ color: "#eab308" }}
          >
            Update Stock →
          </p>
        </button>
      </div>

      {/* Inventory summary */}
      {products.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Shop Inventory
            </p>
            <span
              className="text-xs px-2.5 py-1 rounded-lg"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
              }}
            >
              {products.length} products
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Product", "Category", "Stock", "Price"].map((h) => (
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
                {products.map((product, idx) => (
                  <tr
                    key={product._id || idx}
                    style={{
                      borderBottom:
                        idx < products.length - 1
                          ? "1px solid var(--border-sub)"
                          : "none",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
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
                              size={13}
                              style={{ color: "var(--text-muted)" }}
                            />
                          )}
                        </div>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {product.name || "Product"}
                        </p>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--text-sec)" }}
                    >
                      {product.category || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{
                          background:
                            product.quantity === 0
                              ? "var(--danger-soft)"
                              : "rgba(74,222,128,0.1)",
                          color:
                            product.quantity === 0
                              ? "var(--danger-text)"
                              : "#4ade80",
                          border: `1px solid ${product.quantity === 0 ? "var(--danger-border)" : "rgba(74,222,128,0.25)"}`,
                        }}
                      >
                        {product.quantity}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 font-semibold"
                      style={{ color: "var(--accent-text)" }}
                    >
                      Rs{" "}
                      {(
                        product.price ||
                        0
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
