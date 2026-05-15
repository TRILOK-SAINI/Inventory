import { useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaSignOutAlt, FaBell, FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const PAGE_NAMES = {
  dashboard: "Dashboard",
  program: "Programs",
  team: "Team",
  visit: "Visits",
  contact: "Contacts",
  gallery: "Gallery",
  blog: "Blogs",
  setting: "Settings",
};

export default function Topbar({ toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle responsive check on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Improved page name lookup
  const getPageName = () => {
    const path = location.pathname.toLowerCase();
    const match = Object.keys(PAGE_NAMES).find((key) => path.includes(key));
    return PAGE_NAMES[match] ?? "Dashboard";
  };

const handleLogout = async () => {
  try {
    await logout();
    navigate("/admin/login");
  } 
  catch (error) {
    console.log(error);
  }
};

  const isDark = theme === "dark";

  return (
    <header className="h-14 sm:h-16 flex items-center justify-between px-4 lg:px-6 shrink-0 t-topbar bg-inherit">
      <div className="flex items-center gap-3">
        {/* Toggle only shows on smaller screens */}
        {isMobile && (
          <button onClick={toggleSidebar} className="t-icon-btn">
            <FaBars size={18} />
          </button>
        )}

        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/admin/dashboard")}
        >
          {isDark ? (
            // Show TEXT in Dark Mode
            <span
              className="font-black text-lg tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Inv<span style={{ color: "var(--accent)" }}>ven</span>tory
            </span>
          ) : (
            // Show IMAGE in Light Mode
             <span
              className="font-black text-lg tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Inv<span style={{ color: "var(--accent)" }}>ven</span>tory
            </span>
          )}
        </div>
      </div>

      {/* <h1 className="hidden lg:block font-bold text-sm tracking-tight absolute left-1/2 -translate-x-1/2 text-[var(--text-primary)]">
        {getPageName()}
      </h1> */}

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all"
          style={{
            backgroundColor: isDark
              ? "rgba(251,191,36,0.1)"
              : "rgba(79,70,229,0.1)",
            borderColor: isDark
              ? "rgba(251,191,36,0.2)"
              : "rgba(79,70,229,0.2)",
            color: isDark ? "#fbbf24" : "#4f46e5",
          }}
        >
          {isDark ? (
            <>
              <FaSun size={13} />
              <span className="hidden md:inline">LIGHT</span>
            </>
          ) : (
            <>
              <FaMoon size={13} />
              <span className="hidden md:inline">DARK</span>
            </>
          )}
        </button>

        {/* <button className="t-icon-btn relative p-2">
          <FaBell size={16} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-(--accent) border-2 border-white dark:border-gray-800" />
        </button> */}

        <div className="hidden sm:flex items-center gap-3 pl-3 ml-1 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black bg-(--accent-soft) text-(--accent-text) border border-(--accent-border)">
          {user?.name}
          </div>
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-2 text-sm font-semibold text-(--text-sec) hover:text-red-500 transition-colors"
          >
            <FaSignOutAlt size={12} />
            Logout
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="hidden sm:hidden! t-icon-btn p-2"
        >
          <FaSignOutAlt size={16} />
        </button>
      </div>
    </header>
  );
}
