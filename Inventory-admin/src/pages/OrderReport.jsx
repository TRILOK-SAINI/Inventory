import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Store,
  Wallet,
  X,
  ChevronDown,
  Eye,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api, { getApiError } from "../lib/api";

/* ══════════════════════════════════════════════════════════════
   TINY SHARED COMPONENTS
══════════════════════════════════════════════════════════════ */
const StatusBadge = ({ status }) => {
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
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
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

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div
    className="rounded-2xl p-4"
    style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
    }}
  >
    <div className="flex items-center justify-between">
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
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {sub}
          </p>
        )}
      </div>
      <div
        className="p-2 rounded-xl shrink-0"
        style={{ background: color?.bg || "var(--accent-soft)" }}
      >
        <Icon
          size={18}
          style={{ color: color?.text || "var(--accent-text)" }}
        />
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   ORDER DETAIL MODAL
══════════════════════════════════════════════════════════════ */
function OrderDetailModal({ order, onClose }) {
  if (!order) return null;
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          maxHeight: "88vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-4 px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="p-2 rounded-xl"
            style={{ background: "var(--accent-soft)" }}
          >
            <ClipboardList size={16} style={{ color: "var(--accent-text)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-base font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Order {order.orderNumber}
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {fmt(order.createdAt)}
            </p>
          </div>
          <StatusBadge status={order.status} />
          <button
            onClick={onClose}
            className="p-2 rounded-xl ml-2"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <X size={14} style={{ color: "var(--text-sec)" }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ["Shop", order.shopId?.name || "Super Admin"],
              ["Shop Code", order.shopId?.code || "—"],
              ["City", order.shopId?.city || "—"],
              ["Customer", order.customerName],
              ["Phone", order.customerPhone || "—"],
              ["Taken By", order.takenBy?.name || "—"],
              ["Staff Email", order.takenBy?.email || "—"],
              ["Staff Role", order.takenBy?.role?.replace("_", " ") || "—"],
              ["Notes", order.notes || "—"],
            ].map(([label, val]) => (
              <div
                key={label}
                className="rounded-xl p-3"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {label}
                </p>
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {val}
                </p>
              </div>
            ))}
          </div>

          {/* Items table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <div
              className="px-4 py-2.5"
              style={{
                background: "var(--bg-surface)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Order Items ({order.items.length})
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Product", "SKU", "Qty", "Unit Price", "Total"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-widest ${h === "Total" ? "text-right" : "text-left"}`}
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom:
                        idx < order.items.length - 1
                          ? "1px solid var(--border-sub)"
                          : "none",
                    }}
                  >
                    <td
                      className="px-4 py-2.5 font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.name}
                    </td>
                    <td
                      className="px-4 py-2.5 font-mono text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {item.sku || "—"}
                    </td>
                    <td
                      className="px-4 py-2.5"
                      style={{ color: "var(--text-sec)" }}
                    >
                      {item.quantity}
                    </td>
                    <td
                      className="px-4 py-2.5"
                      style={{ color: "var(--text-sec)" }}
                    >
                      Rs {item.unitPrice.toLocaleString()}
                    </td>
                    <td
                      className="px-4 py-2.5 text-right font-semibold"
                      style={{ color: "var(--accent-text)" }}
                    >
                      Rs {item.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex justify-between text-sm"
              style={{ color: "var(--text-sec)" }}
            >
              <span>Subtotal</span>
              <span>Rs {order.subtotal.toLocaleString()}</span>
            </div>
            <div
              className="flex justify-between text-base font-bold pt-2"
              style={{
                borderTop: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <span>Total</span>
              <span style={{ color: "var(--accent-text)" }}>
                Rs {order.total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cancel info */}
          {order.status === "cancelled" && order.cancelReason && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "var(--danger-soft)",
                border: "1px solid var(--danger-border)",
                color: "var(--danger-text)",
              }}
            >
              <strong>Cancel reason:</strong> {order.cancelReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FILTER BAR
══════════════════════════════════════════════════════════════ */
function FilterBar({ shops, staffList, filters, setFilter, onReset }) {
  const selectStyle = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Shop filter */}
      <div className="flex flex-col gap-1 min-w-0">
        <label
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Shop
        </label>
        <div className="relative">
          <select
            value={filters.shopId}
            onChange={(e) => setFilter("shopId", e.target.value)}
            className="rounded-xl px-3 py-2 text-sm appearance-none pr-8 outline-none min-w-[160px]"
            style={selectStyle}
          >
            <option value="">All Shops</option>
            <option value="null">Super Admin</option>
            {shops.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </div>

      {/* Staff filter */}
      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Staff
        </label>
        <div className="relative">
          <select
            value={filters.staffId}
            onChange={(e) => setFilter("staffId", e.target.value)}
            className="rounded-xl px-3 py-2 text-sm appearance-none pr-8 outline-none min-w-[160px]"
            style={selectStyle}
          >
            <option value="">All Staff</option>
            {staffList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.role?.replace("_", " ")})
                {s.shopId?.code
                  ? ` - ${s.shopId.code}`
                  : !s.shopId
                    ? " - Super Admin"
                    : ""}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Status
        </label>
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value)}
            className="rounded-xl px-3 py-2 text-sm appearance-none pr-8 outline-none min-w-[130px]"
            style={selectStyle}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </div>

      {/* Date from */}
      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          From
        </label>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter("dateFrom", e.target.value)}
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={selectStyle}
        />
      </div>

      {/* Date to */}
      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          To
        </label>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter("dateTo", e.target.value)}
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={selectStyle}
        />
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium self-end"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          color: "var(--text-sec)",
        }}
      >
        <X size={12} /> Reset
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
const EMPTY_FILTERS = {
  shopId: "",
  staffId: "",
  status: "",
  dateFrom: "",
  dateTo: "",
};

export default function OrderReport() {
  useTheme();

  const [shops, setShops] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFiltersState] = useState(EMPTY_FILTERS);
  const [detailOrder, setDetailOrder] = useState(null);

  const setFilter = (key, value) =>
    setFiltersState((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "shopId" ? { staffId: "" } : {}),
    }));

  const resetFilters = () => setFiltersState(EMPTY_FILTERS);

  const visibleStaffList = useMemo(() => {
    const getStaffShopId = (staff) =>
      typeof staff.shopId === "object" ? staff.shopId?._id : staff.shopId;

    if (!filters.shopId) return staffList;

    return staffList.filter((staff) => {
      const staffShopId = getStaffShopId(staff);
      if (filters.shopId === "null") return !staffShopId;
      return staffShopId === filters.shopId;
    });
  }, [filters.shopId, staffList]);

  /* ── Load shops + all staff users (for filter dropdowns) ── */
  useEffect(() => {
    (async () => {
      try {
        const [shopsRes, staffRes] = await Promise.all([
          api.get("/shops", { params: { limit: 200, sort: "name" } }),
          api.get("/orders/report/staff"),
        ]);
        if (shopsRes.data.success) setShops(shopsRes.data.data || []);
        if (staffRes.data.success) setStaffList(staffRes.data.data || []);
      } catch {
        // non-critical
      } finally {
        setMetaLoading(false);
      }
    })();
  }, []);

  /* ── Fetch report ────────────────────────────────────────── */
  const fetchReport = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");
      try {
        const params = { page, limit: 20, ...filters };
        // remove empty strings so they don't become query keys
        Object.keys(params).forEach((k) => {
          if (params[k] === "") delete params[k];
        });

        const { data } = await api.get("/orders/report", { params });
        if (!data.success) throw new Error(data.message);
        setOrders(data.data);
        setSummary(data.summary || {});
        setPagination(data.pagination);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    const id = window.setTimeout(() => void fetchReport(1), 0);
    return () => window.clearTimeout(id);
  }, [fetchReport]);

  /* ── Excel download ──────────────────────────────────────── */
  const handleDownload = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });

      const response = await api.get(
        `/orders/report/download?${params.toString()}`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const disposition = response.headers["content-disposition"];
      const fileName =
        disposition?.split("filename=")[1]?.replace(/"/g, "") ||
        "order-report.xlsx";
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setExporting(false);
    }
  };

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const fmtTime = (d) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Order Reports
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            View and export orders across all shops and staff
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchReport(1)}
            className="p-2.5 rounded-xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <RefreshCw size={14} style={{ color: "var(--text-muted)" }} />
          </button>
          <button
            onClick={handleDownload}
            disabled={exporting || loading || orders.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.25)",
              color: "#22c55e",
            }}
          >
            {exporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {exporting ? "Exporting…" : "Export Excel"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest mb-4"
          style={{ color: "var(--text-muted)" }}
        >
          Filters
        </p>
        {metaLoading ? (
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <Loader2 size={14} className="animate-spin" /> Loading filters…
          </div>
        ) : (
          <FilterBar
            shops={shops}
            staffList={visibleStaffList}
            filters={filters}
            setFilter={setFilter}
            onReset={resetFilters}
          />
        )}
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total Orders"
          value={summary.totalOrders ?? 0}
          icon={ClipboardList}
        />
        <StatCard
          label="Pending"
          value={summary.totalPending ?? 0}
          icon={ShoppingCart}
          color={{ bg: "rgba(234,179,8,0.1)", text: "#eab308" }}
        />
        <StatCard
          label="Delivered"
          value={summary.totalDelivered ?? 0}
          icon={ArrowUp}
          color={{ bg: "rgba(74,222,128,0.1)", text: "#4ade80" }}
        />
        <StatCard
          label="Cancelled"
          value={summary.totalCancelled ?? 0}
          icon={ArrowDown}
          color={{ bg: "var(--danger-soft)", text: "var(--danger-text)" }}
        />
        <StatCard
          label="Revenue"
          value={`Rs ${(summary.totalRevenue ?? 0).toLocaleString()}`}
          icon={Wallet}
          color={{ bg: "rgba(14,165,233,0.12)", text: "var(--accent-text)" }}
          sub="Delivered orders only"
        />
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid var(--danger-border)",
            color: "var(--danger-text)",
          }}
        >
          {error}
        </div>
      )}

      {/* Orders table */}
      <div
        className="rounded-2xl overflow-hidden"
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
            Order Log
          </p>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {pagination.total} order{pagination.total !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: "var(--accent)" }}
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <BarChart3 size={28} style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              No orders match your filters
            </p>
            <button
              onClick={resetFilters}
              className="text-xs font-semibold"
              style={{ color: "var(--accent-text)" }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[
                    "Order #",
                    "Shop",
                    "Customer",
                    "Taken By",
                    "Items",
                    "Total",
                    "Status",
                    "Date",
                    "Detail",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 font-semibold text-xs tracking-widest uppercase ${h === "Detail" ? "text-right" : "text-left"}`}
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
                    {/* Order # */}
                    <td className="px-4 py-3">
                      <span
                        className="font-mono font-semibold text-xs"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {order.orderNumber}
                      </span>
                    </td>

                    {/* Shop */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1.5 rounded-lg shrink-0"
                          style={{ background: "var(--accent-soft)" }}
                        >
                          <Store
                            size={11}
                            style={{ color: "var(--accent-text)" }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-medium text-xs truncate max-w-[120px]"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {order.shopId?.name || "Super Admin"}
                          </p>
                          <p
                            className="text-[10px] font-mono"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {order.shopId?.code || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <p
                        className="font-medium text-xs"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {order.customerName}
                      </p>
                      {order.customerPhone && (
                        <p
                          className="text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {order.customerPhone}
                        </p>
                      )}
                    </td>

                    {/* Taken By */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0"
                          style={{
                            background: "var(--accent-soft)",
                            color: "var(--accent-text)",
                          }}
                        >
                          {order.takenBy?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-xs font-medium truncate max-w-[100px]"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {order.takenBy?.name || "—"}
                          </p>
                          <p
                            className="text-[10px] capitalize"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {order.takenBy?.role?.replace("_", " ") || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{
                          background: "var(--bg-elevated)",
                          color: "var(--text-sec)",
                        }}
                      >
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Total */}
                    <td
                      className="px-4 py-3 font-semibold text-xs"
                      style={{ color: "var(--accent-text)" }}
                    >
                      Rs {order.total.toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>

                    {/* Date */}
                    <td
                      className="px-4 py-3 text-xs whitespace-nowrap"
                      style={{ color: "var(--text-muted)" }}
                      title={fmt(order.createdAt)}
                    >
                      {fmtTime(order.createdAt)}
                    </td>

                    {/* Detail */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDetailOrder(order)}
                        className="p-1.5 rounded-lg"
                        style={{
                          background: "var(--accent-soft)",
                          border: "1px solid var(--accent-border)",
                        }}
                        title="View detail"
                      >
                        <Eye
                          size={13}
                          style={{ color: "var(--accent-text)" }}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchReport(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="w-8 h-8 rounded-lg disabled:opacity-40 flex items-center justify-center"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                }}
              >
                <ChevronLeft size={14} style={{ color: "var(--text-sec)" }} />
              </button>
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {pagination.page}
              </span>
              <button
                onClick={() => fetchReport(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="w-8 h-8 rounded-lg disabled:opacity-40 flex items-center justify-center"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                }}
              >
                <ChevronRight size={14} style={{ color: "var(--text-sec)" }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
        />
      )}
    </div>
  );
}
