import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  FaTachometerAlt,
  FaBook,
  FaUsers,
  FaCalendarCheck,
  FaEnvelope,
  FaImages,
  FaBlog,
  FaCog,
  FaSignOutAlt,
  FaTimes,
  FaCalendarAlt,
  FaStore,
  FaStoreAlt,
} from "react-icons/fa";

const NAV_SECTIONS = [
  {
    label: "Main",
    links: [
      {
        name: "Dashboard",
        path: "/admin/dashboard",
        icon: <FaTachometerAlt />,
      },
      {
        name: "Product",
        icon: <FaUsers />,
        subLinks: [
          { name: "Add Product", path: "/admin/addproduct" },
          { name: "Products", path: "/admin/products" },
        ],
      },
    ],
  },
];
import { useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const NavItem = ({ link, closeSidebar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubLinks = link.subLinks && link.subLinks.length > 0;

  // If it has sub-links, render a button toggle, otherwise render the NavLink
  if (hasSubLinks) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="t-nav-link w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs text-(--text-muted)">
              {link.icon}
            </span>
            {link.name}
          </div>
          {isOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
        </button>

        {isOpen && (
          <div className="ml-7 space-y-1 border-l border-gray-700">
            {link.subLinks.map((sub) => (
              <NavLink
                key={sub.name}
                to={sub.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `t-nav-link text-sm py-1.5 ${isActive ? "active" : ""}`
                }
              >
                {sub.name}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Standard Link
  return (
    <NavLink
      to={link.path}
      onClick={closeSidebar}
      className={({ isActive }) => `t-nav-link${isActive ? " active" : ""}`}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/4 bottom-1/4 w-0.5 rounded-r-full"
              style={{ backgroundColor: "var(--accent)" }}
            />
          )}
          <span
            className="text-xs"
            style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}
          >
            {link.icon}
          </span>
          {link.name}
        </>
      )}
    </NavLink>
  );
};

export default function Sidebar({ closeSidebar }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const navSections =
    user?.role === "shop_admin"
      ? [
          {
            label: "Shop",
            links: [
              {
                name: "My Shop",
                path: "/admin/shop-dashboard",
                icon: <FaStore />,
              },
              {
                name: "Staff",
                path: "/admin/staff",
                icon: <FaUsers />,
              },
            ],
          },
        ]
      : user?.role === "staff" 
      ? [
        {
          label: "Staff",
          links: [
            {
              name: "My Dashboard",
              path: "/admin/staff-dashboard",
              icon: <FaStoreAlt />,
            },
          ],
        },
      ]
      : NAV_SECTIONS.map((section) => ({
          ...section,
          links: [
            ...section.links,
            {
              name: "Shop",
              path: "/admin/shops",
              icon: <FaStore />,
            },
          ],
        }));

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col h-full t-sidebar w-56">
      {/* ── Brand ───────────────────────────────────────── */}
      {closeSidebar && (
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            {isDark ? (
              // Dark Mode: Show TEXT only
              <span
                className="font-black text-base tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Inv<span style={{ color: "var(--accent)" }}>ven</span>tory
              </span>
            ) : (
              // Light Mode: Show IMAGE only
              <span
                className="font-black text-base tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Inv<span style={{ color: "var(--accent)" }}>ven</span>tory
              </span>
            )}
          </div>

          <button onClick={closeSidebar} className="t-icon-btn lg:hidden">
            <FaTimes size={15} />
          </button>
        </div>
      )}

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p
              className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              {section.label}
            </p>

            <div className="space-y-0.5">
              {section.links.map((link) => (
                <NavItem
                  key={link.name}
                  link={link}
                  closeSidebar={closeSidebar}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Logout ──────────────────────────────────────── */}
      <div
        className="px-3 py-4 shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
          style={{
            color: "var(--danger-text)",
            background: "transparent",
            border: "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--danger-soft)";
            e.currentTarget.style.borderColor = "var(--danger-border)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <FaSignOutAlt size={13} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
