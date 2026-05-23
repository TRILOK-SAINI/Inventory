import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  X,
  XCircle,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api, { getApiError } from "../lib/api";

/* ── Order status badge ────────────────────────────────────── */
const OrderStatusBadge = ({ status }) => {
  const cfg = {
    pending: {
      bg: "rgba(234,179,8,0.1)",
      border: "rgba(234,179,8,0.25)",
      text: "#eab308",
      label: "Pending",
    },
    delivered: {
      bg: "rgba(74,222,128,0.1)",
      border: "rgba(74,222,128,0.25)",
      text: "#4ade80",
      label: "Delivered",
    },
    cancelled: {
      bg: "var(--danger-soft)",
      border: "var(--danger-border)",
      text: "var(--danger-text)",
      label: "Cancelled",
    },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
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
      {c.label}
    </span>
  );
};

/* ── Cancel dialog ─────────────────────────────────────────── */
function CancelDialog({ order, loading, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="p-2 rounded-xl"
            style={{ background: "var(--danger-soft)" }}
          >
            <AlertTriangle size={18} style={{ color: "var(--danger-text)" }} />
          </div>
          <h3
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Cancel Order
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--text-sec)" }}>
          Cancel{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {order.orderNumber}
          </strong>
          ? Stock will be restored.
        </p>
        <textarea
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none mb-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            minHeight: "72px",
          }}
          placeholder="Reason for cancellation (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-sec)",
            }}
          >
            Keep Order
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: "var(--danger-soft)",
              border: "1px solid var(--danger-border)",
              color: "var(--danger-text)",
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── New order modal ───────────────────────────────────────── */
function NewOrderModal({ shopProducts, onClose, onSuccess }) {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addToCart = (sp) => {
    const exists = cart.find((c) => c.product === sp.product._id);
    if (exists) {
      if (exists.quantity >= sp.product.quantity) return;
      setCart(
        cart.map((c) =>
          c.product === sp.product._id ? { ...c, quantity: c.quantity + 1 } : c,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          product: sp.product._id,
          name: sp.product.name,
          sku: sp.product.sku || "",
          unitPrice: sp.product.price,
          quantity: 1,
          stock: sp.product.quantity,
        },
      ]);
    }
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product === productId ? { ...c, quantity: c.quantity + delta } : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const total = subtotal;

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError("Add at least one product");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("/orders", {
        customerName: customerName || "Walk-in Customer",
        customerPhone,
        notes,
        items: cart.map((c) => ({ product: c.product, quantity: c.quantity })),
      });
      if (!data.success) throw new Error(data.message);
      onSuccess(data.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-4 lg:p-8">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-5xl rounded-2xl shadow-2xl"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border)",
          maxHeight: "92vh",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center gap-4 px-5 py-4"
          style={{
            background: "var(--bg-base)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            className="p-2 rounded-xl"
            style={{ background: "var(--accent-soft)" }}
          >
            <ShoppingCart size={16} style={{ color: "var(--accent-text)" }} />
          </div>
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              New Order
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Select products and enter customer details
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <X size={15} style={{ color: "var(--text-sec)" }} />
          </button>
        </div>

        <div
          className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6"
          style={{
            maxHeight: "calc(92vh - 95px)",
          }}
        >
          {/* Product picker */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Shop Products
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {shopProducts.length === 0 && (
                <p
                  className="text-sm text-center py-8"
                  style={{ color: "var(--text-muted)" }}
                >
                  No products in shop inventory.
                </p>
              )}
              {shopProducts.map((sp) => {
                const inCart = cart.find((c) => c.product === sp.product._id);
                const outOfStock = Number(sp.product.quantity || 0) === 0;
                return (
                  <div
                    key={sp.product._id}
                    className="flex items-center gap-3 rounded-xl p-3 transition-all"
                    style={{
                      background: inCart
                        ? "var(--accent-soft)"
                        : "var(--bg-surface)",
                      border: `1px solid ${inCart ? "var(--accent-border)" : "var(--border)"}`,
                      opacity: outOfStock ? 0.5 : 1,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {sp.product.images?.[0]?.url ? (
                        <img
                          src={sp.product.images[0].url}
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
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {sp.product.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Stock: {sp.product.quantity || 0} | Rs{" "}
                        {(sp.product.price || 0).toLocaleString()}
                      </p>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(sp.product._id, -1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <Minus
                            size={12}
                            style={{ color: "var(--text-sec)" }}
                          />
                        </button>
                        <span
                          className="w-6 text-center text-sm font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(sp.product._id, 1)}
                          disabled={inCart.quantity >= sp.product.quantity}
                          className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                          style={{
                            background: "var(--accent-soft)",
                            border: "1px solid var(--accent-border)",
                          }}
                        >
                          <Plus
                            size={12}
                            style={{ color: "var(--accent-text)" }}
                          />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => !outOfStock && addToCart(sp)}
                        disabled={outOfStock}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                        style={{ background: "var(--accent)", color: "#fff" }}
                      >
                        {outOfStock ? "Out of Stock" : "Add"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order details */}
          <div className="flex flex-col gap-4">
            {/* Customer */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Customer Details
              </p>
              <input
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                placeholder="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            {/* Cart */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                Cart ({cart.length} items)
              </p>
              {cart.length === 0 ? (
                <p
                  className="text-sm text-center py-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  No items added
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {cart.map((c) => (
                    <div
                      key={c.product}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span
                        className="flex-1 truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {c.name}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        ×{c.quantity}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--accent-text)" }}
                      >
                        Rs {(c.unitPrice * c.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() =>
                          setCart(cart.filter((x) => x.product !== c.product))
                        }
                      >
                        <X size={13} style={{ color: "var(--text-muted)" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div
                className="rounded-xl p-3 space-y-1.5"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-sub)",
                }}
              >
                <div
                  className="flex justify-between text-sm"
                  style={{ color: "var(--text-sec)" }}
                >
                  <span>Subtotal</span>
                  <span>Rs {subtotal.toLocaleString()}</span>
                </div>
                <div
                  className="flex justify-between text-base font-bold pt-1"
                  style={{
                    borderTop: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: "var(--accent-text)" }}>
                    Rs {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <textarea
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                minHeight: "64px",
              }}
              placeholder="Order notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {error && (
              <p
                className="text-sm px-3 py-2 rounded-xl"
                style={{
                  background: "var(--danger-soft)",
                  color: "var(--danger-text)",
                  border: "1px solid var(--danger-border)",
                }}
              >
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving || cart.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ShoppingCart size={15} />
              )}
              {saving
                ? "Placing Order..."
                : `Place Order · Rs ${total.toLocaleString()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main StaffOrders page ─────────────────────────────────── */
const mapShopProducts = (shopData) =>
  (shopData?.products || [])
    .filter((item) => item.product)
    .map((item) => item.product)
    .filter((product) => product.status === "active")
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .map((product) => ({ product }));

export default function StaffOrders() {
  useTheme();
  const [shop, setShop] = useState(null);
  const [shopProducts, setShopProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchShop = useCallback(async () => {
    try {
      const { data } = await api.get("/shops/my-shop");
      if (data.success) {
        setShop(data.data);
        setShopProducts(mapShopProducts(data.data));
      }
    } catch (err) {
      console.error(getApiError(err));
    }
  }, []);

  const fetchOrders = useCallback(
    async (page = 1) => {
      setOrderLoading(true);
      try {
        const params = { page, limit: 15 };
        if (statusFilter) params.status = statusFilter;
        const { data } = await api.get("/orders", { params });
        if (!data.success) throw new Error(data.message);
        setOrders(data.data);
        setPagination(data.pagination);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setOrderLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    fetchShop().finally(() => setLoading(false));
  }, [fetchShop]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const handleDeliver = async (orderId) => {
    setActionLoading(orderId);
    try {
      const { data } = await api.patch(`/orders/${orderId}/deliver`);
      if (!data.success) throw new Error(data.message);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data.data : o)));
    } catch (err) {
      alert(getApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelConfirm = async (reason) => {
    setActionLoading(cancelTarget._id);
    try {
      const { data } = await api.patch(`/orders/${cancelTarget._id}/cancel`, {
        reason,
      });
      if (!data.success) throw new Error(data.message);
      setOrders((prev) =>
        prev.map((o) => (o._id === cancelTarget._id ? data.data : o)),
      );
      setCancelTarget(null);
      fetchShop();
    } catch (err) {
      alert(getApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOrderSuccess = () => {
    setShowNewOrder(false);
    fetchOrders(1);
    fetchShop();
  };

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Orders
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Take new orders, mark deliveries, and cancel pending orders
          </p>
        </div>
        <button
          onClick={() => setShowNewOrder(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus size={15} /> New Order
        </button>
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
        {/* Filter toolbar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {pagination.total} order{pagination.total !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            {["", "pending", "delivered", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  background:
                    statusFilter === s ? "var(--accent)" : "var(--bg-elevated)",
                  color: statusFilter === s ? "#fff" : "var(--text-sec)",
                  border: `1px solid ${statusFilter === s ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {s || "All"}
              </button>
            ))}
          </div>
        </div>

        {orderLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2
              size={22}
              className="animate-spin"
              style={{ color: "var(--accent)" }}
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ClipboardList size={28} style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-primary)" }}>No orders found</p>
            <button
              onClick={() => setShowNewOrder(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus size={14} /> Create First Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[
                    "Order #",
                    "Customer",
                    "Items",
                    "Total",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 font-semibold text-xs tracking-widest uppercase ${h === "Actions" ? "text-right" : "text-left"}`}
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr
                    key={order._id}
                    style={{
                      borderBottom:
                        idx < orders.length - 1
                          ? "1px solid var(--border-sub)"
                          : "none",
                    }}
                  >
                    <td className="px-4 py-3">
                      <p
                        className="font-mono font-semibold text-xs"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {order.orderNumber}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {order.customerName}
                      </p>
                      {order.customerPhone && (
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {order.customerPhone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs"
                        style={{
                          background: "var(--bg-elevated)",
                          color: "var(--text-sec)",
                        }}
                      >
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 font-semibold"
                      style={{ color: "var(--accent-text)" }}
                    >
                      Rs {order.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleDeliver(order._id)}
                              disabled={actionLoading === order._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
                              style={{
                                background: "rgba(74,222,128,0.1)",
                                border: "1px solid rgba(74,222,128,0.25)",
                                color: "#4ade80",
                              }}
                            >
                              {actionLoading === order._id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <CheckCircle size={12} />
                              )}
                              Deliver
                            </button>
                            <button
                              onClick={() => setCancelTarget(order)}
                              disabled={actionLoading === order._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
                              style={{
                                background: "var(--danger-soft)",
                                border: "1px solid var(--danger-border)",
                                color: "var(--danger-text)",
                              }}
                            >
                              <XCircle size={12} /> Cancel
                            </button>
                          </>
                        )}
                        {order.status === "delivered" && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {order.deliveredAt
                              ? new Date(order.deliveredAt).toLocaleDateString(
                                  "en-IN",
                                )
                              : "Delivered"}
                          </span>
                        )}
                        {order.status === "cancelled" && order.cancelReason && (
                          <span
                            className="text-xs truncate max-w-28"
                            title={order.cancelReason}
                            style={{ color: "var(--text-muted)" }}
                          >
                            {order.cancelReason}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!orderLoading && orders.length > 0 && pagination.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {pagination.total} total
            </p>
            <div className="flex gap-2">
              <PagBtn
                onClick={() => fetchOrders(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft size={14} />
              </PagBtn>
              <PagBtn active>{pagination.page}</PagBtn>
              <PagBtn
                onClick={() => fetchOrders(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight size={14} />
              </PagBtn>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewOrder && shop && (
        <NewOrderModal
          shopProducts={shopProducts}
          onClose={() => setShowNewOrder(false)}
          onSuccess={handleOrderSuccess}
        />
      )}
      <CancelDialog
        order={cancelTarget}
        loading={actionLoading === cancelTarget?._id}
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg text-xs font-medium disabled:opacity-40"
      style={{
        background: active ? "var(--accent)" : "var(--bg-surface)",
        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
        color: active ? "#fff" : "var(--text-sec)",
      }}
    >
      {children}
    </button>
  );
}
