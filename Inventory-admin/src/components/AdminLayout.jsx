import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col t-base overflow-hidden">
      {/* Topbar — fixed height */}
      <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Body — fills remaining height */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex h-full">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <div className="relative z-50 h-full shadow-2xl">
              <Sidebar closeSidebar={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* ✅ Main content — must be block + overflow-y-auto */}
        <main className="flex-1 overflow-y-auto t-base">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
