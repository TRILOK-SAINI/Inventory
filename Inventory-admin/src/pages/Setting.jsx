import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ═══════════════════════════════════════════════════════════
   TABS CONFIG
══════════════════════════════════════════════════════════════ */
const TABS = [
  { id: "general", label: "General", icon: "⚙️" },
  { id: "policies", label: "Policies", icon: "📄" },
];

const POLICY_PAGES = [
  { key: "termsOfUse", label: "Terms of Use" },
  { key: "privacyPolicy", label: "Privacy Policy" },
  { key: "helpSupport", label: "Help & Support" },
  { key: "faqs", label: "FAQs" },
];

/* ═══════════════════════════════════════════════════════════
   SHARED UI ATOMS
══════════════════════════════════════════════════════════════ */
const inputCls =
  "w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]";

const labelCls =
  "block text-[11px] font-bold tracking-widest uppercase text-[var(--text-muted)] mb-1.5";

function Label({ children }) {
  return <span className={labelCls}>{children}</span>;
}

function Field({ label, hint, children, className = "" }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && <Label>{label}</Label>}
      {hint && (
        <p className="text-xs text-[var(--text-muted)] mb-1.5 leading-relaxed">
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

function Input({ label, hint, className = "", wrapClass = "", ...props }) {
  return (
    <Field label={label} hint={hint} className={wrapClass}>
      <input className={`${inputCls} ${className}`} {...props} />
    </Field>
  );
}

function Textarea({ label, hint, rows = 3, wrapClass = "", ...props }) {
  return (
    <Field label={label} hint={hint} className={wrapClass}>
      <textarea
        rows={rows}
        className={`${inputCls} resize-y leading-relaxed`}
        {...props}
      />
    </Field>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="t-card rounded-2xl p-5 mb-5">
      <h3 className="flex items-center gap-2 text-sm font-black t-text mb-4">
        <span>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative flex-shrink-0 w-11 h-6 rounded-full border-none cursor-pointer transition-colors duration-200"
        style={{ background: value ? "var(--accent)" : "var(--border)" }}
      >
        <span
          className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all duration-200"
          style={{ left: value ? "22px" : "3px" }}
        />
      </button>
      <span className="text-sm font-medium text-[var(--text-sec)]">
        {label}
      </span>
    </div>
  );
}

/* ── Image Uploader ─────────────────────────────────────── */
function ImageUploader({ label, hint, value, onChange, onRemove }) {
  const ref = useRef();
  return (
    <Field label={label} hint={hint}>
      {value ? (
        <div className="flex items-center gap-3 flex-wrap">
          <img
            src={value}
            alt="preview"
            className="w-20 h-14 object-contain rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-1 flex-shrink-0"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => ref.current.click()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-sec)] cursor-pointer hover:text-[var(--text-primary)] transition-colors"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)] cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current.click()}
          className="w-full border-2 border-dashed border-[var(--border)] rounded-xl py-5 bg-[var(--bg-base)] text-[var(--text-muted)] text-sm font-semibold cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent-text)] transition-colors"
        >
          📁 Click to upload
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files[0] && onChange(e.target.files[0])}
      />
    </Field>
  );
}

/* ── Repeatable simple list (emails / phones) ───────────── */
function RepeatableSimple({
  label,
  items,
  onChange,
  type = "text",
  placeholder,
  addLabel,
}) {
  const add = () => onChange([...items, ""]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, val) =>
    onChange(items.map((item, idx) => (idx === i ? val : item)));

  return (
    <Field label={label}>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type={type}
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className={`${inputCls} flex-1`}
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="flex-shrink-0 px-2.5 py-2 text-xs font-bold rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="self-start mt-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)] cursor-pointer hover:opacity-80 transition-opacity"
        >
          + {addLabel || `Add ${label}`}
        </button>
      </div>
    </Field>
  );
}

/* ═══════════════════════════════════════════════════════════
   GENERAL PANEL
══════════════════════════════════════════════════════════════ */
function GeneralPanel({ data, setData, onFile, previews }) {
  const set = (k, v) => setData((p) => ({ ...p, [k]: v }));

  return (
    <>
      {/* Brand */}
      <SectionCard title="Brand" icon="🏷️">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Input
            label="Site Name"
            value={data.siteName || ""}
            onChange={(e) => set("siteName", e.target.value)}
            placeholder="EduAitor"
          />
          <Input
            label="Tagline"
            value={data.tagline || ""}
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="AI-Powered Education"
          />
        </div>
        <Textarea
          label="Brand Description"
          hint="Short description for your brand (used across site)"
          value={data.description || ""}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="An all-in-one SaaS platform that simplifies educational institute management..."
        />
        <Input
          label="Copyright Text"
          value={data.copyright || ""}
          onChange={(e) => set("copyright", e.target.value)}
          placeholder={`© ${new Date().getFullYear()} EduAitor. All rights reserved.`}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <ImageUploader
            label="Logo"
            hint="Used on navbar & footer"
            value={previews.logo || data.logoUrl}
            onChange={(f) => onFile("logo", f)}
            onRemove={() => set("logoUrl", "")}
          />
          <ImageUploader
            label="Favicon"
            hint="32×32 or 64×64 PNG recommended"
            value={previews.favicon || data.faviconUrl}
            onChange={(f) => onFile("favicon", f)}
            onRemove={() => set("faviconUrl", "")}
          />
        </div>
      </SectionCard>

      {/* Contact Info */}
      <SectionCard title="Contact Info" icon="📞">
        <RepeatableSimple
          label="Email Addresses"
          items={data.emails?.length ? data.emails : [""]}
          onChange={(v) => set("emails", v)}
          type="email"
          placeholder="support@eduaitor.com"
          addLabel="Email"
        />
        <RepeatableSimple
          label="Phone Numbers"
          items={data.phones?.length ? data.phones : [""]}
          onChange={(v) => set("phones", v)}
          type="tel"
          placeholder="+91 XXXXX XXXXX"
          addLabel="Phone"
        />
        <Input
          label="Address"
          value={data.address || ""}
          onChange={(e) => set("address", e.target.value)}
          placeholder="City, State, Country"
        />
      </SectionCard>

      {/* Social Links */}
      <SectionCard title="Social Links" icon="🌐">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Input
            label="Instagram"
            value={data.instagram || ""}
            onChange={(e) => set("instagram", e.target.value)}
            placeholder="https://instagram.com/..."
          />
          <Input
            label="LinkedIn"
            value={data.linkedin || ""}
            onChange={(e) => set("linkedin", e.target.value)}
            placeholder="https://linkedin.com/company/..."
          />
          <Input
            label="Facebook"
            value={data.facebook || ""}
            onChange={(e) => set("facebook", e.target.value)}
            placeholder="https://facebook.com/..."
          />
          <Input
            label="Twitter / X"
            value={data.twitter || ""}
            onChange={(e) => set("twitter", e.target.value)}
            placeholder="https://x.com/..."
          />
        </div>
      </SectionCard>

      {/* App Download */}
      <SectionCard title="App Download Links" icon="📱">
        <Toggle
          label="Show app download section"
          value={data.showAppDownload !== false}
          onChange={(v) => set("showAppDownload", v)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Input
            label="Google Play URL"
            value={data.googlePlayUrl || ""}
            onChange={(e) => set("googlePlayUrl", e.target.value)}
            placeholder="https://play.google.com/store/apps/..."
          />
          <Input
            label="App Store URL"
            value={data.appStoreUrl || ""}
            onChange={(e) => set("appStoreUrl", e.target.value)}
            placeholder="https://apps.apple.com/..."
          />
        </div>
      </SectionCard>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   POLICIES PANEL
══════════════════════════════════════════════════════════════ */
function PolicySections({ sections, onChange }) {
  const add = () => onChange([...sections, { heading: "", content: "" }]);
  const remove = (i) => onChange(sections.filter((_, idx) => idx !== i));
  const update = (i, key, val) =>
    onChange(sections.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));

  return (
    <Field
      label="Content Sections"
      hint="Each section has an optional heading + body. Add as many as needed."
    >
      <div className="flex flex-col gap-3 mt-1">
        {sections.length === 0 && (
          <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-xl text-[var(--text-muted)] text-sm">
            No sections yet — click "+ Add Section" to start writing.
          </div>
        )}
        {sections.map((section, i) => (
          <div
            key={i}
            className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg-base)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">
                Section {i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)] cursor-pointer"
              >
                Remove
              </button>
            </div>
            <input
              value={section.heading || ""}
              onChange={(e) => update(i, "heading", e.target.value)}
              placeholder="Section heading (optional)"
              className={`${inputCls} mb-3`}
            />
            <textarea
              rows={5}
              value={section.content || ""}
              onChange={(e) => update(i, "content", e.target.value)}
              placeholder="Write the content for this section..."
              className={`${inputCls} resize-y leading-relaxed`}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-3 px-4 py-2 text-xs font-bold rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)] cursor-pointer hover:opacity-80 transition-opacity"
      >
        + Add Section
      </button>
    </Field>
  );
}

function PoliciesPanel({ data, setData }) {
  const [activePolicyTab, setActivePolicyTab] = useState("termsOfUse");

  const set = (policyKey, field, val) =>
    setData((p) => ({
      ...p,
      [policyKey]: { ...(p[policyKey] || {}), [field]: val },
    }));

  const activePolicy = data[activePolicyTab] || {};
  const activeLabel = POLICY_PAGES.find(
    (p) => p.key === activePolicyTab,
  )?.label;

  return (
    <>
      {/* Policy sub-tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {POLICY_PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => setActivePolicyTab(p.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
              activePolicyTab === p.key
                ? "bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-text)]"
                : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-sec)] hover:text-[var(--text-primary)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <SectionCard title={activeLabel} icon="📄">
        <Toggle
          label="Show this page on the website"
          value={activePolicy.enabled !== false}
          onChange={(v) => set(activePolicyTab, "enabled", v)}
        />

        <Divider label="Page Details" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Input
            label="Page Title"
            value={activePolicy.title || ""}
            onChange={(e) => set(activePolicyTab, "title", e.target.value)}
            placeholder={activeLabel}
          />
          <Input
            label="URL Slug"
            hint="Path shown in the browser e.g. /privacy-policy"
            value={activePolicy.slug || ""}
            onChange={(e) => set(activePolicyTab, "slug", e.target.value)}
            placeholder={`/${activePolicyTab.replace(/([A-Z])/g, "-$1").toLowerCase()}`}
          />
        </div>

        <Input
          label="Last Updated Date"
          type="date"
          value={activePolicy.lastUpdated || ""}
          onChange={(e) => set(activePolicyTab, "lastUpdated", e.target.value)}
          wrapClass="max-w-xs"
        />

        <Divider label="Page Content" />

        <PolicySections
          sections={activePolicy.sections || []}
          onChange={(v) => set(activePolicyTab, "sections", v)}
        />
      </SectionCard>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════════ */
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl font-bold text-sm text-white shadow-2xl"
      style={{
        background: type === "error" ? "#ef4444" : "#22c55e",
        animation: "slideUp 0.3s ease",
      }}
    >
      {msg}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function Setting() {
  useTheme(); // subscribe to theme context for CSS var updates

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [general, setGeneral] = useState({});
  const [policies, setPolicies] = useState({});

  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});

  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* ── Fetch ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/settings`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setGeneral(data.general || {});
        setPolicies(data.policies || {});
      } catch {
        showToast("Failed to load settings", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── File ── */
  const handleFile = (key, file) => {
    setFiles((f) => ({ ...f, [key]: file }));
    setPreviews((p) => ({ ...p, [key]: URL.createObjectURL(file) }));
  };

  /* ── Save ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify({ general, policies }));
      Object.entries(files).forEach(([k, f]) => fd.append(k, f));

      const res = await fetch(`${API}/settings`, { method: "PUT", body: fd });
      if (!res.ok) throw new Error();
      const updated = await res.json();

      setGeneral(updated.general || {});
      setPolicies(updated.policies || {});
      setFiles({});
      setPreviews({});
      showToast("Settings saved!");
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Panel renderer ── */
  const renderPanel = () => {
    if (loading)
      return (
        <div className="flex items-center justify-center py-24 text-[var(--text-muted)] text-sm">
          Loading settings…
        </div>
      );
    switch (activeTab) {
      case "general":
        return (
          <GeneralPanel
            data={general}
            setData={setGeneral}
            onFile={handleFile}
            previews={previews}
          />
        );
      case "policies":
        return <PoliciesPanel data={policies} setData={setPolicies} />;
      default:
        return null;
    }
  };

  const activeTabMeta = TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen t-base">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Sticky top header ─────────────────────────────── */}
      <header className="t-topbar sticky top-0 z-20 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="m-0 text-lg font-black t-text leading-tight">
            Site Settings
          </h1>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Manage your website content & configuration
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-bold rounded-xl text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          style={{ background: "var(--accent)" }}
        >
          {saving ? "Saving…" : "💾 Save Changes"}
        </button>
      </header>

      <div className="flex" style={{ minHeight: "calc(100vh - 65px)" }}>
        {/* ── Desktop sidebar ────────────────────────────── */}
        <aside
          className="hidden sm:flex flex-col w-48 flex-shrink-0 t-sidebar sticky top-[65px] p-3 gap-1 overflow-y-auto"
          style={{ height: "calc(100vh - 65px)" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm border cursor-pointer transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-text)] font-bold"
                  : "bg-transparent border-transparent text-[var(--text-sec)] font-medium hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </aside>

        {/* ── Mobile bottom tab bar ─────────────────────── */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 t-topbar border-t border-[var(--border)] flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold border-none cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? "text-[var(--accent-text)] bg-[var(--accent-soft)]"
                  : "text-[var(--text-muted)] bg-transparent"
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Main content ──────────────────────────────── */}
        <main className="flex-1 px-4 sm:px-8 py-6 overflow-y-auto pb-28 sm:pb-8 max-w-3xl w-full">
          {/* Page section title */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">{activeTabMeta?.icon}</span>
            <h2 className="text-base font-black t-text m-0">
              {activeTabMeta?.label}
            </h2>
          </div>

          {renderPanel()}

          {/* Bottom action bar */}
          {!loading && (
            <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-sec)] cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-bold rounded-xl text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: "var(--accent)" }}
              >
                {saving ? "Saving…" : "💾 Save Changes"}
              </button>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
