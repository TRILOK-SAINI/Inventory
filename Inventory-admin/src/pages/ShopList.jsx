import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Store,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api, { getApiError } from "../lib/api";

/* ── form default ──────────────────────────────────────────── */
const initialForm = {
  name: "",
  ownerName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gstNumber: "",
  status: "active",
};

/* ── tiny reusables ────────────────────────────────────────── */
const Label = ({ children, required }) => (
  <label
    className="block text-xs font-semibold tracking-widest uppercase mb-2"
    style={{ color: "var(--text-sec)" }}
  >
    {children}{" "}
    {required && <span style={{ color: "var(--danger-text)" }}>*</span>}
  </label>
);

const Input = ({ icon: Icon, error, ...props }) => (
  <div>
    <div className="relative">
      {Icon && (
        <Icon
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--text-muted)" }}
        />
      )}
      <input
        className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all ${Icon ? "pl-9" : ""}`}
        style={{
          background: "var(--bg-elevated)",
          border: `1px solid ${error ? "var(--danger-border)" : "var(--border)"}`,
          color: "var(--text-primary)",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--accent-border)";
          e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error
            ? "var(--danger-border)"
            : "var(--border)";
          e.target.style.boxShadow = "none";
        }}
        {...props}
      />
    </div>
    {error && (
      <p className="mt-1 text-xs" style={{ color: "var(--danger-text)" }}>
        {error}
      </p>
    )}
  </div>
);

const Textarea = ({ error, ...props }) => (
  <div>
    <textarea
      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all resize-none"
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid ${error ? "var(--danger-border)" : "var(--border)"}`,
        color: "var(--text-primary)",
        minHeight: "120px",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "var(--accent-border)";
        e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = error
          ? "var(--danger-border)"
          : "var(--border)";
        e.target.style.boxShadow = "none";
      }}
      {...props}
    />
    {error && (
      <p className="mt-1 text-xs" style={{ color: "var(--danger-text)" }}>
        {error}
      </p>
    )}
  </div>
);

const Select = ({ children, ...props }) => (
  <div className="relative">
    <select
      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all appearance-none"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
      }}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      size={14}
      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      style={{ color: "var(--text-muted)" }}
    />
  </div>
);

const StatusBadge = ({ status }) => {
  const active = status === "active";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{
        background: active ? "rgba(74,222,128,0.1)" : "var(--danger-soft)",
        border: `1px solid ${active ? "rgba(74,222,128,0.25)" : "var(--danger-border)"}`,
        color: active ? "#4ade80" : "var(--danger-text)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: active ? "#4ade80" : "var(--danger-text)" }}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
};

/* ── Credential modal ──────────────────────────────────────── */
const CredentialModal = ({ credentials, shopName, onClose }) => {
  if (!credentials) return null;
  const copy = (text) => navigator.clipboard?.writeText(text);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <Check size={22} style={{ color: "var(--accent-text)" }} />
        </div>
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Shop created!
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-sec)" }}>
          <strong style={{ color: "var(--text-primary)" }}>{shopName}</strong>{" "}
          admin can log in with:
        </p>
        <div className="space-y-3">
          {[
            ["Username", credentials.username],
            ["Password", credentials.password],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  {label}
                </p>
                <p
                  className="text-sm font-mono mt-0.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {value}
                </p>
              </div>
              <button
                onClick={() => copy(value)}
                className="p-2 rounded-lg"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent-text)",
                }}
              >
                <Copy size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Done
        </button>
      </div>
    </div>
  );
};

/* ── Confirm delete ────────────────────────────────────────── */
const ConfirmDialog = ({ target, loading, onCancel, onConfirm }) => {
  if (!target) return null;
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
        <div className="flex items-center gap-3 mb-3">
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
            Delete Shop
          </h3>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-sec)" }}>
          Delete "
          <strong style={{ color: "var(--text-primary)" }}>
            {target.name}
          </strong>
          " and its admin login?
        </p>
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
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: "var(--danger-soft)",
              border: "1px solid var(--danger-border)",
              color: "var(--danger-text)",
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Shop form modal ───────────────────────────────────────── */
function ShopForm({
  open,
  mode,
  form,
  errors,
  saving,
  onClose,
  onSubmit,
  setField,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-4 lg:p-8">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl"
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
          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <ArrowLeft size={16} style={{ color: "var(--text-sec)" }} />
          </button>
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {mode === "edit" ? "Edit Shop" : "Add New Shop"}
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Shop admin logs in with the email · default password: 123456
            </p>
          </div>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="ml-auto flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {saving
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : "Save Shop"}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <X size={16} style={{ color: "var(--text-sec)" }} />
          </button>
        </div>

        <div
          className="p-6 lg:p-8 overflow-y-auto"
          style={{
            maxHeight: "calc(92vh - 95px)",
          }}
        >
          {errors.submit && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "var(--danger-soft)",
                border: "1px solid var(--danger-border)",
                color: "var(--danger-text)",
              }}
            >
              {errors.submit}
            </div>
          )}

          {/* Shop details */}
          <div
            className="rounded-2xl p-5 mb-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex items-center gap-2 mb-5 pb-4"
              style={{ borderBottom: "1px solid var(--border-sub)" }}
            >
              <div
                className="p-1.5 rounded-lg"
                style={{ background: "var(--accent-soft)" }}
              >
                <Store size={14} style={{ color: "var(--accent-text)" }} />
              </div>
              <h3
                className="font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Shop Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label required>Shop Name</Label>
                <Input
                  icon={Store}
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  error={errors.name}
                  placeholder="e.g. Downtown Outlet"
                />
              </div>
              <div>
                <Label required>Owner / Admin Name</Label>
                <Input
                  icon={User}
                  value={form.ownerName}
                  onChange={(e) => setField("ownerName", e.target.value)}
                  error={errors.ownerName}
                  placeholder="Shop admin name"
                />
              </div>
              <div>
                <Label required>Email (Login Username)</Label>
                <Input
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  error={errors.email}
                  placeholder="shop@example.com"
                />
              </div>
              <div>
                <Label required>Phone</Label>
                <Input
                  icon={Phone}
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  error={errors.phone}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="sm:col-span-2">
                <Label required>Address</Label>
                <Textarea
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  error={errors.address}
                  placeholder="Full shop address"
                />
              </div>
              <div>
                <Label required>City</Label>
                <Input
                  icon={MapPin}
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  error={errors.city}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setField("state", e.target.value)}
                />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input
                  value={form.pincode}
                  onChange={(e) => setField("pincode", e.target.value)}
                />
              </div>
              <div>
                <Label>GST Number</Label>
                <Input
                  value={form.gstNumber}
                  onChange={(e) =>
                    setField("gstNumber", e.target.value.toUpperCase())
                  }
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Info note */}
          <div
            className="rounded-xl px-4 py-3 text-xs"
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
              color: "var(--accent-text)",
            }}
          >
            <strong>Note:</strong> Once the shop is created, the shop admin logs
            in and manages their own products and staff from their panel.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Shop view modal ───────────────────────────────────────── */
function ShopView({ shop, onClose, onEdit }) {
  if (!shop) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{
            background: "var(--bg-elevated)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3">
            <Store size={18} style={{ color: "var(--accent-text)" }} />
            <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>
              {shop.name}
            </h2>
            <StatusBadge status={shop.status} />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <X size={15} style={{ color: "var(--text-sec)" }} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Owner", shop.ownerName],
              ["Email", shop.email],
              ["Phone", shop.phone],
              ["City", `${shop.city}${shop.state ? `, ${shop.state}` : ""}`],
              ["Pincode", shop.pincode || "-"],
              ["GST", shop.gstNumber || "-"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl p-3"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-sub)",
                }}
              >
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {label}
                </p>
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {value || "-"}
                </p>
              </div>
            ))}
          </div>

          {shop.address && (
            <div
              className="rounded-xl p-3"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-sub)",
              }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Address
              </p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {shop.address}
              </p>
            </div>
          )}

          {/* Staff count if available */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
            }}
          >
            <Users size={15} style={{ color: "var(--accent-text)" }} />
            <p
              className="text-xs font-medium"
              style={{ color: "var(--accent-text)" }}
            >
              Products and staff are managed by the shop admin from their panel.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-sec)",
              }}
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(shop);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Pencil size={13} /> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────── */
export default function ShopList() {
  useTheme();

  const [shops, setShops] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [form, setFormState] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState({ open: false, mode: "add", id: null });
  const [viewShop, setViewShop] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [credentialShop, setCredentialShop] = useState("");

  const fetchShops = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10, sort };
        if (search) params.search = search;
        if (status) params.status = status;
        const { data } = await api.get("/shops", { params });
        if (!data.success) throw new Error(data.message);
        setShops(data.data);
        setPagination(data.pagination);
      } catch (err) {
        setErrors({ submit: getApiError(err) });
      } finally {
        setLoading(false);
      }
    },
    [search, status, sort],
  );

  useEffect(() => {
    fetchShops(1);
  }, [fetchShops]);

  const stats = useMemo(
    () => ({
      total: pagination.total,
      active: shops.filter((s) => s.status === "active").length,
      inactive: shops.filter((s) => s.status === "inactive").length,
    }),
    [pagination.total, shops],
  );

  const setField = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const openAdd = () => {
    setFormState(initialForm);
    setErrors({});
    setModal({ open: true, mode: "add", id: null });
  };

  const openEdit = (shop) => {
    setFormState({
      name: shop.name || "",
      ownerName: shop.ownerName || "",
      email: shop.email || "",
      phone: shop.phone || "",
      address: shop.address || "",
      city: shop.city || "",
      state: shop.state || "",
      pincode: shop.pincode || "",
      gstNumber: shop.gstNumber || "",
      status: shop.status || "active",
    });
    setErrors({});
    setModal({ open: true, mode: "edit", id: shop._id });
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Shop name is required";
    if (!form.ownerName.trim()) next.ownerName = "Owner name is required";
    if (!form.email.trim()) next.email = "Email is required";
    if (!form.phone.trim()) next.phone = "Phone is required";
    if (!form.address.trim()) next.address = "Address is required";
    if (!form.city.trim()) next.city = "City is required";
    return next;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const url = `/shops${modal.mode === "edit" ? `/${modal.id}` : ""}`;
      const method = modal.mode === "edit" ? "put" : "post";
      const { data } = await api[method](url, form);
      setModal({ open: false, mode: "add", id: null });
      fetchShops(pagination.page);
      if (modal.mode === "add") {
        setCredentials(data.credentials);
        setCredentialShop(data.data?.name || form.name);
      }
    } catch (err) {
      setErrors({ submit: getApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/shops/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchShops(pagination.page);
    } catch (err) {
      setErrors({ submit: getApiError(err) });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusToggle = async (shop) => {
    const next = shop.status === "active" ? "inactive" : "active";
    try {
      const { data } = await api.patch(`/shops/${shop._id}/status`, {
        status: next,
      });
      if (data.success)
        setShops((prev) =>
          prev.map((s) => (s._id === shop._id ? data.data : s)),
        );
    } catch (err) {
      console.error(getApiError(err));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Shops
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Manage shop branches and their admin accounts
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus size={15} /> Add Shop
        </button>
      </div>

      {/* Global error */}
      {errors.submit && !modal.open && (
        <div
          className="mb-5 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid var(--danger-border)",
            color: "var(--danger-text)",
          }}
        >
          {errors.submit}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          ["Total Shops", stats.total, Store],
          ["Active", stats.active, Check],
          ["Inactive", stats.inactive, AlertTriangle],
        ].map(([label, value, Icon]) => (
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
                style={{ background: "var(--accent-soft)" }}
              >
                <Icon size={18} style={{ color: "var(--accent-text)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-52">
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
            placeholder="Search shops…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="-createdAt">Newest First</option>
          <option value="createdAt">Oldest First</option>
          <option value="name">Name A–Z</option>
          <option value="-name">Name Z–A</option>
        </Select>
        <button
          onClick={() => fetchShops(pagination.page)}
          className="p-2.5 rounded-xl"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <RefreshCw size={14} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: "var(--accent)" }}
            />
          </div>
        ) : shops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Store size={30} style={{ color: "var(--text-muted)" }} />
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              No shops found
            </p>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus size={15} /> Add First Shop
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[
                    "Shop",
                    "Admin",
                    "Location",
                    "Code",
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
                {shops.map((shop, idx) => (
                  <tr
                    key={shop._id}
                    style={{
                      borderBottom:
                        idx < shops.length - 1
                          ? "1px solid var(--border-sub)"
                          : "none",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: "var(--accent-soft)",
                            border: "1px solid var(--accent-border)",
                          }}
                        >
                          <Store
                            size={15}
                            style={{ color: "var(--accent-text)" }}
                          />
                        </div>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {shop.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {shop.ownerName}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {shop.email}
                      </p>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--text-sec)" }}
                    >
                      {shop.city}
                      {shop.state ? `, ${shop.state}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-mono text-xs px-2 py-1 rounded-lg"
                        style={{
                          background: "var(--bg-elevated)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {shop.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={shop.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <ActionBtn
                          title="View"
                          onClick={() => setViewShop(shop)}
                        >
                          <Eye size={14} />
                        </ActionBtn>
                        <ActionBtn
                          title="Edit"
                          accent
                          onClick={() => openEdit(shop)}
                        >
                          <Pencil size={14} />
                        </ActionBtn>
                        <ActionBtn
                          title="Toggle status"
                          onClick={() => handleStatusToggle(shop)}
                        >
                          <RefreshCw size={14} />
                        </ActionBtn>
                        <ActionBtn
                          title="Delete"
                          danger
                          onClick={() => setDeleteTarget(shop)}
                        >
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

        {!loading && shops.length > 0 && (
          <div
            className="flex items-center justify-between px-4 py-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Showing {(pagination.page - 1) * 10 + 1}–
              {Math.min(pagination.page * 10, pagination.total)} of{" "}
              {pagination.total}
            </p>
            <div className="flex gap-2">
              <PagBtn
                onClick={() => fetchShops(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft size={14} />
              </PagBtn>
              <PagBtn active>{pagination.page}</PagBtn>
              <PagBtn
                onClick={() => fetchShops(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight size={14} />
              </PagBtn>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ShopForm
        open={modal.open}
        mode={modal.mode}
        form={form}
        errors={errors}
        saving={saving}
        onClose={() => setModal({ open: false, mode: "add", id: null })}
        onSubmit={handleSubmit}
        setField={setField}
      />
      <ShopView
        shop={viewShop}
        onClose={() => setViewShop(null)}
        onEdit={openEdit}
      />
      <ConfirmDialog
        target={deleteTarget}
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <CredentialModal
        credentials={credentials}
        shopName={credentialShop}
        onClose={() => setCredentials(null)}
      />
    </div>
  );
}

function ActionBtn({ children, onClick, title, danger, accent }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-lg transition-all"
      style={{
        background: danger
          ? "var(--danger-soft)"
          : accent
            ? "var(--accent-soft)"
            : "var(--bg-elevated)",
        border: `1px solid ${danger ? "var(--danger-border)" : accent ? "var(--accent-border)" : "var(--border)"}`,
        color: danger
          ? "var(--danger-text)"
          : accent
            ? "var(--accent-text)"
            : "var(--text-sec)",
      }}
    >
      {children}
    </button>
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
