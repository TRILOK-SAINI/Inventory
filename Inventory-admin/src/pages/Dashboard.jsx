import {
  FaBox,
  FaChartLine,
  FaExclamationTriangle,
  FaTag,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaList,
  FaWarehouse,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const STATS = [
  {
    label: "Total Products",
    value: "1,240",
    change: "+12",
    up: true,
    icon: <FaBox />,
  },
  {
    label: "Active Listings",
    value: "856",
    change: "+3%",
    up: true,
    icon: <FaTag />,
  },
  {
    label: "Low Stock Alert",
    value: "14",
    change: "-2",
    up: false, // Falling numbers in "alerts" is usually good (green)
    icon: <FaExclamationTriangle />,
  },
  {
    label: "Monthly Revenue",
    value: "$42.5k",
    change: "+18%",
    up: true,
    icon: <FaChartLine />,
  },
];

const ACTIVITY = [
  { action: "Restocked 'Wireless Headphones'", time: "5 min ago" },
  { action: "Price updated for 'Smart Watch v2'", time: "22 min ago" },
  { action: "New product category 'Home Office' created", time: "2 hr ago" },
  { action: "Bulk export of inventory completed", time: "4 hr ago" },
  { action: "Out of stock: 'Ergonomic Chair'", time: "6 hr ago" },
  { action: "Supplier 'Logistics X' shipment received", time: "Yesterday" },
];

const QUICK_LINKS = [
  { label: "Add New Product", path: "/admin/products/new", icon: <FaPlus /> },
  { label: "Manage Inventory", path: "/admin/inventory", icon: <FaWarehouse /> },
  { label: "Product Categories", path: "/admin/categories", icon: <FaList /> },
  { label: "Sales Reports", path: "/admin/reports", icon: <FaChartLine /> },
];

export default function Dashboard() {
  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto w-full t-base">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight t-text">Product Overview</h1>
          <p className="text-sm mt-1 t-text-sec">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link 
            to="/admin/addproduct" 
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-(--accent) text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <FaPlus size={12} /> Add Product
        </Link>
      </div>

      {/* Stats Grid - Responsive 1 column on mobile, 2 on tablet, 4 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="t-card rounded-2xl p-5 hover:translate-y-[-2px] transition-transform shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg t-accent-bg t-accent-text border border-(--accent-border)">
                {s.icon}
              </div>

              <span
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                  s.up
                    ? "text-green-500 bg-green-500/10"
                    : "text-red-500 bg-red-500/10"
                }`}
              >
                {s.up ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
                {s.change}
              </span>
            </div>

            <p className="text-2xl font-black t-text">{s.value}</p>
            <p className="text-xs mt-1 font-medium t-text-sec uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 t-card rounded-2xl p-6">
          <h2 className="text-sm font-bold mb-6 flex items-center gap-2 t-text">
            <span className="w-2 h-2 rounded-full bg-(--accent) animate-pulse" />
            Inventory Log
          </h2>

          <div className="space-y-5">
            {ACTIVITY.map((item, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-(--border) group-hover:bg-(--accent) transition-colors" />
                <div className="flex-1 border-b pb-4 t-divider last:border-0 last:pb-0">
                   <p className="text-sm t-text leading-none mb-1">{item.action}</p>
                   <span className="text-[11px] font-medium t-text-muted">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <div className="t-card rounded-2xl p-6">
            <h2 className="text-sm font-bold mb-4 t-text">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-2.5">
              {QUICK_LINKS.map((q) => (
                <Link
                  key={q.label}
                  to={q.path}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all t-hover t-border t-text hover:bg-(--bg-hover)"
                >
                  <span className="flex items-center gap-3">
                    <span className="opacity-70">{q.icon}</span>
                    {q.label}
                  </span>
                  <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Catalog Health */}
          <div className="t-card rounded-2xl p-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-4 t-text-muted">
              Stock Distribution
            </p>

            <div className="space-y-4">
              {[
                ["In Stock", 82],
                ["Low Stock", 12],
                ["Out of Stock", 6],
              ].map(([name, pct]) => (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="t-text-sec font-medium">{name}</span>
                    <span className="t-text-muted">{pct}%</span>
                  </div>

                  <div className="h-1.5 bg-(--border-sub) rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        name === 'Out of Stock' ? 'bg-red-500' : 'bg-(--accent)'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}