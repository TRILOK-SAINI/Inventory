import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Upload, X, ImageIcon, Package, Tag, DollarSign,
  Hash, Layers, Weight, Ruler, Star, ChevronDown, ArrowLeft, Save, Loader2, Trash2
} from "lucide-react";

/* ── Shared UI atoms (same as AddProduct) ──────────────────── */
const Label = ({ children, required }) => (
  <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-sec)" }}>
    {children} {required && <span style={{ color: "var(--danger-text)" }}>*</span>}
  </label>
);
const Input = ({ icon: Icon, error, className = "", ...props }) => (
  <div className="relative">
    {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />}
    <input className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all ${Icon ? "pl-9" : ""} ${className}`}
      style={{ background: "var(--bg-elevated)", border: `1px solid ${error ? "var(--danger-border)" : "var(--border)"}`, color: "var(--text-primary)" }}
      onFocus={e => { e.target.style.borderColor = "var(--accent-border)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
      onBlur={e =>  { e.target.style.borderColor = error ? "var(--danger-border)" : "var(--border)"; e.target.style.boxShadow = "none"; }}
      {...props} />
    {error && <p className="mt-1 text-xs" style={{ color: "var(--danger-text)" }}>{error}</p>}
  </div>
);
const Textarea = ({ error, ...props }) => (
  <div>
    <textarea className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all resize-none"
      style={{ background: "var(--bg-elevated)", border: `1px solid ${error ? "var(--danger-border)" : "var(--border)"}`, color: "var(--text-primary)", minHeight: "100px" }}
      onFocus={e => { e.target.style.borderColor = "var(--accent-border)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
      onBlur={e =>  { e.target.style.borderColor = error ? "var(--danger-border)" : "var(--border)"; e.target.style.boxShadow = "none"; }}
      {...props} />
    {error && <p className="mt-1 text-xs" style={{ color: "var(--danger-text)" }}>{error}</p>}
  </div>
);
const Select = ({ icon: Icon, children, error, ...props }) => (
  <div className="relative">
    {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: "var(--text-muted)" }} />}
    <select className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all appearance-none ${Icon ? "pl-9" : ""}`}
      style={{ background: "var(--bg-elevated)", border: `1px solid ${error ? "var(--danger-border)" : "var(--border)"}`, color: "var(--text-primary)" }}
      onFocus={e => { e.target.style.borderColor = "var(--accent-border)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
      onBlur={e =>  { e.target.style.borderColor = error ? "var(--danger-border)" : "var(--border)"; e.target.style.boxShadow = "none"; }}
      {...props}>{children}</select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
    {error && <p className="mt-1 text-xs" style={{ color: "var(--danger-text)" }}>{error}</p>}
  </div>
);
const Card = ({ title, icon: Icon, children, className = "" }) => (
  <div className={`rounded-2xl p-6 ${className}`} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
    {title && (
      <div className="flex items-center gap-2.5 mb-5 pb-4" style={{ borderBottom: "1px solid var(--border-sub)" }}>
        {Icon && <div className="p-1.5 rounded-lg" style={{ background: "var(--accent-soft)" }}><Icon size={15} style={{ color: "var(--accent-text)" }} /></div>}
        <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{title}</h3>
      </div>
    )}
    {children}
  </div>
);
const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-sm" style={{ color: "var(--text-sec)" }}>{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <div className="w-10 h-5 rounded-full transition-all duration-200" style={{ background: checked ? "var(--accent)" : "var(--border)" }}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? "left-5" : "left-0.5"}`} />
      </div>
    </div>
  </label>
);

const CATEGORIES = ["Electronics","Clothing","Footwear","Home & Living","Beauty","Sports","Books","Toys","Food","Accessories","Other"];
const UNITS      = ["piece","kg","litre","box","set","pair"];

export default function EditProduct() {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const fileRef    = useRef(null);

  const [fetching,  setFetching]  = useState(true);
  const [form,      setForm]      = useState(null);
  const [newImages, setNewImages] = useState([]);          // { file, preview }[]
  const [savedImgs, setSavedImgs] = useState([]);          // existing images from DB
  const [toDelete,  setToDelete]  = useState([]);          // public_ids to delete
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [dragging,  setDragging]  = useState(false);
const API = import.meta.env.VITE_API_URL;   // Vite proxy forwards this to http://localhost:5000

  /* ── load product ────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API}/products/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        const p = data.data;
        setForm({
          name:             p.name             || "",
          sku:              p.sku              || "",
          category:         p.category         || "",
          brand:            p.brand            || "",
          shortDescription: p.shortDescription || "",
          description:      p.description      || "",
          price:            p.price            ?? "",
          comparePrice:     p.comparePrice     ?? "",
          quantity:         p.quantity         ?? "",
          unit:             p.unit             || "piece",
          tags:             (p.tags || []).join(", "),
          weight:           p.weight           ?? "",
          status:           p.status           || "active",
          isFeatured:       p.isFeatured       || false,
          dimensions: {
            length: p.dimensions?.length ?? "",
            width:  p.dimensions?.width  ?? "",
            height: p.dimensions?.height ?? "",
          },
        });
        setSavedImgs(p.images || []);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    })();
  }, [API, id]);

  const set    = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: "" })); };
  const setDim = (key, val) => setForm(f => ({ ...f, dimensions: { ...f.dimensions, [key]: val } }));

  /* ── images ──────────────────────────────────────────────── */
  const addFiles = useCallback((files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    const previews = valid.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setNewImages(prev => [...prev, ...previews].slice(0, Math.max(0, 8 - savedImgs.length)));
  }, [savedImgs.length]);

  const onDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  const removeSaved = (img) => {
    setSavedImgs(prev => prev.filter(i => i.public_id !== img.public_id));
    if (img.public_id) setToDelete(prev => [...prev, img.public_id]);
  };

  const removeNew = (idx) => {
    setNewImages(prev => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_, i) => i !== idx); });
  };

  /* ── validate ────────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = "Product name is required";
    if (!form.category)           e.category    = "Please select a category";
    if (!form.description.trim()) e.description = "Description is required";
    if (form.price === "" || isNaN(form.price) || Number(form.price) < 0) {
      e.price = "Enter a valid price";
    }
    if (
      form.quantity === "" ||
      isNaN(form.quantity) ||
      Number(form.quantity) < 0
    ) {
      e.quantity = "Enter a valid quantity";
    }
    if (savedImgs.length + newImages.length === 0) e.images = "At least one image is required";
    return e;
  };

  /* ── submit ──────────────────────────────────────────────── */
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      newImages.forEach(img => fd.append("images", img.file));
      if (toDelete.length) fd.append("deleteImages", JSON.stringify(toDelete));

      const payload = {
        ...form,
        tags:       form.tags.split(",").map(t => t.trim()).filter(Boolean),
        dimensions: form.dimensions,
      };
      Object.entries(payload).forEach(([k, v]) =>
        fd.append(k, typeof v === "object" ? JSON.stringify(v) : v)
      );

      const res  = await fetch(`${API}/products/${id}`, {
        method: "PUT",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      navigate("/admin/products");
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* ── render ──────────────────────────────────────────────── */
  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p style={{ color: "var(--danger-text)" }}>Product not found.</p>
        <button onClick={() => navigate(-1)} className="text-sm underline" style={{ color: "var(--accent-text)" }}>Go Back</button>
      </div>
    );
  }

  const totalImages = savedImgs.length + newImages.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl transition-all"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-border)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
          <ArrowLeft size={16} style={{ color: "var(--text-sec)" }} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Edit Product</h1>
          <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "var(--text-muted)" }}>{form.name}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-sec)" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {errors.submit && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm"
          style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", color: "var(--danger-text)" }}>
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">

          {/* Basic Info */}
          <Card title="Basic Information" icon={Package}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label required>Product Name</Label>
                <Input icon={Package} value={form.name} onChange={e => set("name", e.target.value)} error={errors.name} />
              </div>
              <div>
                <Label>SKU</Label>
                <Input icon={Hash} value={form.sku} onChange={e => set("sku", e.target.value.toUpperCase())} />
              </div>
              <div>
                <Label>Brand</Label>
                <Input icon={Tag} value={form.brand} onChange={e => set("brand", e.target.value)} />
              </div>
              <div>
                <Label required>Category</Label>
                <Select icon={Layers} value={form.category} onChange={e => set("category", e.target.value)} error={errors.category}>
                  <option value="" disabled>Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onChange={e => set("unit", e.target.value)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Short Description</Label>
                <Input value={form.shortDescription} onChange={e => set("shortDescription", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label required>Description</Label>
                <Textarea rows={5} value={form.description} onChange={e => set("description", e.target.value)} error={errors.description} />
              </div>
              <div className="sm:col-span-2">
                <Label>Tags</Label>
                <Input icon={Tag} placeholder="wireless, bluetooth  (comma separated)"
                  value={form.tags} onChange={e => set("tags", e.target.value)} />
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card title="Pricing & Inventory" icon={DollarSign}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label required>Price (₹)</Label>
                <Input icon={DollarSign} type="number" min="0" step="0.01" value={form.price}
                  onChange={e => set("price", e.target.value)} error={errors.price} />
              </div>
              <div>
                <Label>Compare Price (₹)</Label>
                <Input type="number" min="0" step="0.01" value={form.comparePrice}
                  onChange={e => set("comparePrice", e.target.value)} />
              </div>
              <div>
                <Label required>Quantity</Label>
                <Input type="number" min="0" value={form.quantity}
                  onChange={e => set("quantity", e.target.value)} error={errors.quantity} />
              </div>
              <div>
                <Label>Weight (g)</Label>
                <Input icon={Weight} type="number" min="0" value={form.weight}
                  onChange={e => set("weight", e.target.value)} />
              </div>
            </div>
          </Card>

          {/* Dimensions */}
          <Card title="Dimensions" icon={Ruler}>
            <div className="grid grid-cols-3 gap-4">
              {["length","width","height"].map(d => (
                <div key={d}>
                  <Label>{d.charAt(0).toUpperCase() + d.slice(1)} (cm)</Label>
                  <Input type="number" min="0" step="0.1" value={form.dimensions[d]}
                    onChange={e => setDim(d, e.target.value)} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">

          {/* Images */}
          <Card title="Product Images" icon={ImageIcon}>
            {/* Existing images */}
            {savedImgs.length > 0 && (
              <div className="mb-4">
                <p className="text-xs mb-2 font-semibold" style={{ color: "var(--text-muted)" }}>CURRENT IMAGES</p>
                <div className="grid grid-cols-3 gap-2">
                  {savedImgs.map((img, i) => (
                    <div key={img.public_id || i} className="relative group aspect-square rounded-xl overflow-hidden"
                      style={{ border: "1px solid var(--border)" }}>
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {img.isPrimary && (
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                          style={{ background: "var(--accent)", color: "#fff" }}>PRIMARY</div>
                      )}
                      <button onClick={() => removeSaved(img)}
                        className="absolute top-1 right-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(220,38,38,0.85)" }}>
                        <Trash2 size={10} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drop zone */}
            {totalImages < 8 && (
              <div
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className="rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3 py-6 px-4 text-center"
                style={{
                  border:     `2px dashed ${dragging ? "var(--accent)" : errors.images ? "var(--danger-border)" : "var(--border)"}`,
                  background: dragging ? "var(--accent-soft)" : "var(--bg-elevated)",
                }}>
                <Upload size={18} style={{ color: "var(--accent-text)" }} />
                <p className="text-sm" style={{ color: "var(--text-sec)" }}>
                  Add more images <span style={{ color: "var(--accent-text)" }}>({8 - totalImages} slots left)</span>
                </p>
                <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
                  onChange={e => addFiles(e.target.files)} />
              </div>
            )}
            {errors.images && <p className="mt-2 text-xs" style={{ color: "var(--danger-text)" }}>{errors.images}</p>}

            {/* New image previews */}
            {newImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {newImages.map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden"
                    style={{ border: "2px dashed var(--accent-border)" }}>
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ background: "rgba(99,102,241,0.85)", color: "#fff" }}>NEW</div>
                    <button onClick={() => removeNew(i)}
                      className="absolute top-1 right-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.7)" }}>
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Status */}
          <Card title="Status & Options" icon={Star}>
            <div className="flex flex-col gap-5">
              <div>
                <Label>Product Status</Label>
                <Select value={form.status} onChange={e => set("status", e.target.value)}>
                  <option value="active">Active — visible in store</option>
                  <option value="inactive">Inactive — hidden</option>
                  <option value="draft">Draft — unpublished</option>
                </Select>
              </div>
              <div className="pt-2" style={{ borderTop: "1px solid var(--border-sub)" }}>
                <Toggle label="Featured Product" checked={form.isFeatured}
                  onChange={e => set("isFeatured", e.target.checked)} />
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-sub)" }}>
                <div className="w-2 h-2 rounded-full"
                  style={{ background: form.status === "active" ? "#4ade80" : form.status === "inactive" ? "var(--danger-text)" : "var(--text-muted)" }} />
                <span className="text-xs capitalize" style={{ color: "var(--text-sec)" }}>
                  Status: <strong>{form.status}</strong>
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-end gap-3 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-sec)" }}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--accent)", color: "#fff" }}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
