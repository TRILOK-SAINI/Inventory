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

const ComingSoon = ({ name }) => (
  <div className="flex items-center justify-center min-h-[60vh] t-base">
    <div className="text-center">
      {/* Uses your t-accent-bg and t-accent-text classes */}
      <div className="w-14 h-14 border rounded-2xl flex items-center justify-center mx-auto mb-4 t-accent-bg">
        <svg
          className="w-6 h-6 t-accent-text"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
      </div>

      {/* Uses your t-text and t-text-sec classes */}
      <h2 className="font-black text-xl mb-2 t-text">{name}</h2>
      <p className="text-sm font-medium t-text-sec">
        This page is under construction.
      </p>
    </div>
  </div>
);

export default function App() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      {/* Login */}
      <Route path="/admin/login" element={<Login />} />

      {/* Protected admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "shop_admin", "staff"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* <Route index element={<Navigate to="/admin/dashboard" replace />} /> */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <Dashboard />
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
          path="products"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <ProductList />
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
          path="shops"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <ShopList />
            </ProtectedRoute>
          }
        />
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
            <ProtectedRoute allowedRoles={["shop_admin"]}>
              <StaffList />
            </ProtectedRoute>
          }
        />

        {/* staff routes */}
        <Route
          path="staff-dashboard"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
