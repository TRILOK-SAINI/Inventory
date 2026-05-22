import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  FaTachometerAlt,
  FaUsers,
  FaSignOutAlt,
  FaTimes,
  FaStore,
  FaStoreAlt,
  FaBoxOpen,
  FaPlusCircle,
  FaListAlt,
  FaWarehouse,
  FaShoppingCart,
  FaChartBar,
} from "react-icons/fa";
import { useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const getNavSections = (role) => {
  if (role === "super_admin") {
    return [
      {
        label: "Main",
        links: [
          {
            name: "Dashboard",
            path: "/admin/dashboard",
            icon: <FaTachometerAlt />,
          },
          { name: "Shops", path: "/admin/shops", icon: <FaStore /> },
          {
            name: "Products",
            icon: <FaBoxOpen />,
            subLinks: [
              {
                name: "Add Product",
                path: "/admin/addproduct",
                icon: <FaPlusCircle />,
              },
              {
                name: "Product List",
                path: "/admin/products",
                icon: <FaListAlt />,
              },
            ],
          },
          {
            name: "Stock Management",
            icon: <FaWarehouse />,
            subLinks: [
              {
                name: "Stock Entry",
                path: "/admin/inventory-entry",
                icon: <FaWarehouse />,
              },
              {
                name: "Reports",
                path: "/admin/stock-report",
                icon: <FaChartBar />,
              },
            ],
          },
        ],
      },
    ];
  }

  if (role === "shop_admin") {
    return [
      {
        label: "Shop",
        links: [
          {
            name: "My Shop",
            path: "/admin/shop-dashboard",
            icon: <FaStoreAlt />,
          },
          { name: "Orders", path: "/admin/orders", icon: <FaShoppingCart /> },
          { name: "Staff", path: "/admin/staff", icon: <FaUsers /> },
        ],
      },
    ];
  }

  if (role === "staff") {
    return [
      {
        label: "Staff",
        links: [
          {
            name: "Dashboard",
            path: "/admin/staff-dashboard",
            icon: <FaTachometerAlt />,
          },
          { name: "Orders", path: "/admin/orders", icon: <FaShoppingCart /> },
        ],
      },
    ];
  }

  return [];
};

const NavItem = ({ link, closeSidebar }) => {
  const location = useLocation();
  const hasSubLinks = link.subLinks && link.subLinks.length > 0;
  const hasActiveSubLink = hasSubLinks
    ? link.subLinks.some((sub) => location.pathname === sub.path)
    : false;
  const [isOpen, setIsOpen] = useState(hasActiveSubLink);

  if (hasSubLinks) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="t-nav-link w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span
              className="text-xs"
              style={{
                color: hasActiveSubLink
                  ? "var(--accent)"
                  : "var(--text-muted)",
              }}
            >
              {link.icon}
            </span>
            {link.name}
          </div>
          {isOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
        </button>
        {isOpen && (
          <div
            className="ml-7 space-y-1 border-l"
            style={{ borderColor: "var(--border)" }}
          >
            {link.subLinks.map((sub) => (
              <NavLink
                key={sub.name}
                to={sub.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `t-nav-link text-sm py-1.5 flex items-center gap-2 ${isActive ? "active" : ""}`
                }
              >
                <span className="text-[11px]">{sub.icon}</span>
                {sub.name}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

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
  useTheme();

  const navSections = getNavSections(user?.role);

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
      {closeSidebar && (
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="font-black text-base tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Inv<span style={{ color: "var(--accent)" }}>ven</span>tory
          </span>
          <button onClick={closeSidebar} className="t-icon-btn lg:hidden">
            <FaTimes size={15} />
          </button>
        </div>
      )}

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

      {user && (
        <div
          className="px-4 py-3 shrink-0 mx-3 mb-2 rounded-xl"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent-text)",
                border: "1px solid var(--accent-border)",
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p
                className="text-xs font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {user.name}
              </p>
              <p
                className="text-[10px] capitalize truncate"
                style={{ color: "var(--text-muted)" }}
              >
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-3 pb-4 shrink-0">
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
          <FaSignOutAlt size={13} /> Sign Out
        </button>
      </div>
    </div>
  );
}
