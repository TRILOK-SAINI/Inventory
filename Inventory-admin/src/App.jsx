import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import AddProduct from "./pages/AddProduct";
import ProductList from "./pages/ProductList";
import EditProduct from "./pages/EditProduct";
import ShopList from "./pages/ShopList";
import ShopDashboard from "./pages/ShopDashboard";
import StaffList from "./pages/StaffList";
import StaffDashboard from "./pages/StaffDashboard";
import StaffOrders from "./pages/StaffOrders";
import InventoryEntry from "./pages/InventoryEntry";
import StockReport from "./pages/StockReport";
import OrderReport from "./pages/OrderReport";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "shop_admin", "staff"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* ── super_admin ──────────────────────────────────── */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="shops"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <ShopList />
            </ProtectedRoute>
          }
        />
        <Route
          path="products"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <ProductList />
            </ProtectedRoute>
          }
        />
        <Route
          path="addproduct"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <AddProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="editproduct/:id"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <EditProduct />
            </ProtectedRoute>
          }
        />

        <Route
          path="inventory-entry"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <InventoryEntry />
            </ProtectedRoute>
          }
        />

        <Route
          path="stock-report"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <StockReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="order-report"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <OrderReport />
            </ProtectedRoute>
          }
        />

        {/* ── shop_admin ───────────────────────────────────── */}
        <Route
          path="shop-dashboard"
          element={
            <ProtectedRoute allowedRoles={["shop_admin"]}>
              <ShopDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff"
          element={
            <ProtectedRoute allowedRoles={["super_admin", "shop_admin"]}>
              <StaffList />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute allowedRoles={["shop_admin", "staff"]}>
              <StaffOrders />
            </ProtectedRoute>
          }
        />

        {/* ── staff ───────────────────────────────────────── */}
        <Route
          path="staff-dashboard"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
