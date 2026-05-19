import { useEffect, useState } from "react";
import { Loader2, Package, Store, User } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api, { getApiError } from "../lib/api";

export default function ShopDashboard() {
  useTheme();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/shops/my-shop");
        if (!data.success) throw new Error(data.message);
        setShop(data.data);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    })();
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {shop.name}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Assigned inventory for this shop
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-lg text-xs font-semibold capitalize"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent-text)",
            border: "1px solid var(--accent-border)",
          }}
        >
          {shop.status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          ["Shop Code", shop.code, Store],
          ["Shop Admin", shop.ownerName, User],
          ["Products", shop.products?.length || 0, Package],
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
                  className="text-xl font-black mt-1"
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

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {[
                  "Product",
                  "Category",
                  "Allocated Qty",
                  "Selling Price",
                  "Inventory Stock",
                ].map((heading) => (
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
              {(shop.products || []).map((item, idx) => (
                <tr
                  key={item.product?._id || idx}
                  style={{
                    borderBottom:
                      idx < shop.products.length - 1
                        ? "1px solid var(--border-sub)"
                        : "none",
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
                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.product?.name || "Product"}
                        </p>
                        <p
                          className="text-xs"
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
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.allocatedQuantity}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--accent-text)" }}
                  >
                    Rs{" "}
                    {(
                      item.sellingPrice ||
                      item.product?.price ||
                      0
                    ).toLocaleString()}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--text-sec)" }}
                  >
                    {item.product?.quantity ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!shop.products || shop.products.length === 0) && (
          <div className="py-16 text-center">
            <Package
              size={28}
              className="mx-auto mb-3"
              style={{ color: "var(--text-muted)" }}
            />
            <p style={{ color: "var(--text-primary)" }}>
              No products assigned yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
