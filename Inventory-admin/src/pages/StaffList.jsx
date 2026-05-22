import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  User,
  UserCheck,
  UserX,
  X,
  Briefcase,
  Camera,
  Hash,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api, { getApiError } from "../lib/api";

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

const StatusBadge = ({ isActive }) => (
  <span
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
    style={{
      background: isActive ? "rgba(74,222,128,0.1)" : "var(--danger-soft)",
      border: `1px solid ${isActive ? "rgba(74,222,128,0.25)" : "var(--danger-border)"}`,
      color: isActive ? "#4ade80" : "var(--danger-text)",
    }}
  >
    <span
      className="w-1.5 h-1.5 rounded-full"
      style={{ background: isActive ? "#4ade80" : "var(--danger-text)" }}
    />
    {isActive ? "Active" : "Inactive"}
  </span>
);

const CredentialModal = ({ credentials, staffName, onClose }) => {
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
          Staff added successfully
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-sec)" }}>
          {staffName} can log in with these credentials.
        </p>
        <div className="space-y-3">
          {[
            ["Username (Email)", credentials.username],
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
            Remove Staff
          </h3>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-sec)" }}>
          Remove "{target.name}" and delete their login access?
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
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

const initialForm = {
  name: "",
  email: "",
  phone: "",
  designation: "",
  age: "",
  gender: "",
  address: "",
  photo: null,
  photoFile: null,
};

function StaffForm({
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setField("photoFile", file); // real File for FormData
    const reader = new FileReader();
    reader.onload = () => setField("photo", reader.result); // base64 just for preview
    reader.readAsDataURL(file);
  };
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-4 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="p-2 rounded-xl"
            style={{ background: "var(--accent-soft)" }}
          >
            <User size={16} style={{ color: "var(--accent-text)" }} />
          </div>
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {mode === "edit" ? "Edit Staff Member" : "Add Staff Member"}
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Staff will login with email + password 123456
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

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {errors.submit && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{
                background: "var(--danger-soft)",
                border: "1px solid var(--danger-border)",
                color: "var(--danger-text)",
              }}
            >
              {errors.submit}
            </div>
          )}

          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                background: "var(--bg-surface)",
                border: "2px dashed var(--border)",
              }}
            >
              {form.photo ? (
                <img
                  src={form.photo}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera size={24} style={{ color: "var(--text-muted)" }} />
              )}
            </div>
            <label
              className="cursor-pointer text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent-text)",
                border: "1px solid var(--accent-border, var(--border))",
              }}
            >
              {form.photo ? "Change Photo" : "Upload Photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          </div>

          {/* Row 1: Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Full Name</Label>
              <Input
                icon={User}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                error={errors.name}
                placeholder="Staff member name"
              />
              {errors.name && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--danger-text)" }}
                >
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <Label required>Email</Label>
              <Input
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                error={errors.email}
                placeholder="staff@example.com"
                disabled={mode === "edit"}
              />
              {errors.email && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--danger-text)" }}
                >
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Phone + Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input
                icon={Phone}
                value={form.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setField("phone", val);
                }}
                error={errors.phone}
                placeholder="10-digit number"
              />
              {errors.phone && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--danger-text)" }}
                >
                  {errors.phone}
                </p>
              )}
            </div>
            <div>
              <Label>Designation</Label>
              <Input
                icon={Briefcase}
                value={form.designation}
                onChange={(e) => setField("designation", e.target.value)}
                placeholder="e.g. Sales Executive"
              />
            </div>
          </div>

          {/* Row 3: Age + Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Age</Label>
              <Input
                icon={Hash}
                type="number"
                value={form.age}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                  setField("age", val);
                }}
                error={errors.age}
                placeholder="e.g. 28"
              />
              {errors.age && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--danger-text)" }}
                >
                  {errors.age}
                </p>
              )}
            </div>
            <div>
              <Label>Gender</Label>
              <div className="relative mt-1">
                <select
                  value={form.gender}
                  onChange={(e) => setField("gender", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm appearance-none pr-8"
                  style={{
                    background: "var(--bg-surface)",
                    border: `1px solid var(--border)`,
                    color: form.gender
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                    outline: "none",
                  }}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not">Prefer not to say</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
            </div>
          </div>

          {/* Row 4: Address full width */}
          <div>
            <Label>Address</Label>
            <div className="relative mt-1">
              <MapPin
                size={14}
                className="absolute left-3 top-3 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <textarea
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Street, City, State, PIN"
                rows={3}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm resize-none"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-sec)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : "Add Staff"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffList() {
  useTheme();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState({ open: false, mode: "add", id: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [credentialName, setCredentialName] = useState("");

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/staff");
      if (!data.success) throw new Error(data.message);
      setStaff(data.data);
    } catch (err) {
      setErrors({ submit: getApiError(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const openAdd = () => {
    setForm(initialForm);
    setErrors({});
    setModal({ open: true, mode: "add", id: null });
  };

  const openEdit = (member) => {
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      designation: member.designation || "",
      age: member.age || "",
      gender: member.gender || "",
      address: member.address || "",
      photo: member.photo?.url || "", // show existing URL as preview
      photoFile: null, // no new file yet
    });
    setErrors({});
    setModal({ open: true, mode: "edit", id: member._id });
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    if (form.phone && !/^\d{10}$/.test(form.phone))
      next.phone = "Phone must be exactly 10 digits";
    if (
      form.age &&
      (isNaN(form.age) || Number(form.age) < 18 || Number(form.age) > 100)
    )
      next.age = "Enter a valid age between 18 and 100";
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
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("designation", form.designation);
      fd.append("gender", form.gender);
      fd.append("age", form.age);
      fd.append("address", form.address);

      // only append photo if it's a new file (File object), not an existing URL
      if (form.photoFile) fd.append("photo", form.photoFile);

      const url = `/staff${modal.mode === "edit" ? `/${modal.id}` : ""}`;
      const method = modal.mode === "edit" ? "put" : "post";
      const { data } = await api[method](url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setModal({ open: false, mode: "add", id: null });
      fetchStaff();
      if (modal.mode === "add") {
        setCredentials(data.credentials);
        setCredentialName(data.data?.name || form.name);
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
      await api.delete(`/staff/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchStaff();
    } catch (err) {
      setErrors({ submit: getApiError(err) });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggle = async (member) => {
    try {
      const { data } = await api.patch(`/staff/${member._id}/toggle`);
      if (data.success)
        setStaff((prev) =>
          prev.map((s) => (s._id === member._id ? data.data : s)),
        );
    } catch (err) {
      setErrors({ submit: getApiError(err) });
    }
  };

  const activeCount = staff.filter((s) => s.isActive).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Staff
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Manage staff members for your shop
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus size={15} /> Add Staff
        </button>
      </div>

      {errors.submit && !modal.open && (
        <div
          className="mb-6 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid var(--danger-border)",
            color: "var(--danger-text)",
          }}
        >
          {errors.submit}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          ["Total Staff", staff.length, User],
          ["Active", activeCount, UserCheck],
          ["Inactive", staff.length - activeCount, UserX],
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
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <User size={30} style={{ color: "var(--text-muted)" }} />
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              No staff added yet
            </p>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus size={15} /> Add First Staff Member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[
                    "Member",
                    "Contact",
                    "Designation",
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
                {staff.map((member, idx) => (
                  <tr
                    key={member._id}
                    style={{
                      borderBottom:
                        idx < staff.length - 1
                          ? "1px solid var(--border-sub)"
                          : "none",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                          style={{
                            background: "var(--accent-soft)",
                            color: "var(--accent-text)",
                            border: "1px solid var(--accent-border)",
                          }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p
                            className="font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {member.name}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--text-sec)" }}
                    >
                      {member.phone || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {member.designation ? (
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-sec)",
                          }}
                        >
                          {member.designation}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={member.isActive} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <ActionBtn
                          title="Edit"
                          accent
                          onClick={() => openEdit(member)}
                        >
                          <Pencil size={14} />
                        </ActionBtn>
                        <ActionBtn
                          title={member.isActive ? "Deactivate" : "Activate"}
                          onClick={() => handleToggle(member)}
                        >
                          <RefreshCw size={14} />
                        </ActionBtn>
                        <ActionBtn
                          title="Remove"
                          danger
                          onClick={() => setDeleteTarget(member)}
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
      </div>

      <StaffForm
        open={modal.open}
        mode={modal.mode}
        form={form}
        errors={errors}
        saving={saving}
        onClose={() => setModal({ open: false, mode: "add", id: null })}
        onSubmit={handleSubmit}
        setField={setField}
      />
      <ConfirmDialog
        target={deleteTarget}
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <CredentialModal
        credentials={credentials}
        staffName={credentialName}
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
