import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleHomeRoutes = {
  super_admin: "/admin/dashboard",
  shop_admin: "/admin/shop-dashboard",
  staff: "/admin/staff-dashboard",
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center t-base">
        <p className="t-text">Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to={roleHomeRoutes[user.role] || "/admin/login"} replace />;
  }

  return children;
};

export default ProtectedRoute;
