import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "super_admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (user?.role === "shop_admin") {
      navigate("/admin/shop-dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    console.log("hello from sending request");

    try {
      const loggedInUser = await login(formData);

      if (loggedInUser.role === "super_admin") {
        toast.success("Login successful");
        navigate("/admin/dashboard");
      } else if (loggedInUser.role === "shop_admin") {
        toast.success("Login successful");
        navigate("/admin/shop-dashboard");
      } else {
        setError("Unauthorized role");
      }
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 t-base">
      {/* LEFT PANEL */}
      <div className="hidden md:flex flex-col justify-center px-16 py-20 relative overflow-hidden t-elevated">
        {/* Background accents */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-(--accent-soft) rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-(--accent-soft) rounded-full blur-3xl pointer-events-none" />

        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full w-fit mb-10 t-accent-bg t-accent-text border border-(--accent-border)">
          <span className="w-1.5 h-1.5 rounded-full bg-(--accent) animate-pulse" />
          Admin Panel
        </span>

        <h1 className="text-6xl font-black leading-[1.05] mb-6 tracking-tight t-text">
          Control
          <br />
          your <span className="t-accent-text"> Inventory .</span>
        </h1>

        <p className="text-base leading-relaxed max-w-sm mb-14 t-text-sec">
          A unified dashboard to manage content, team, analytics and settings —
          all from one place.
        </p>

        <div className="flex gap-10">
          {[
            ["100%", "Secure"],
            ["∞", "Scalable"],
            ["24/7", "Available"],
          ].map(([num, label]) => (
            <div key={label}>
              <p className="text-3xl font-black t-text">{num}</p>
              <p className="text-xs mt-1 tracking-wide t-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center px-5 py-10 relative t-base">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-10">
            <div className="w-12 h-12 rounded-xl t-accent-bg border border-(--accent-border) flex items-center justify-center mb-5">
              <svg
                className="w-5 h-5 t-accent-text"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h2 className="text-3xl font-black tracking-tight mb-1 t-text">
              Welcome back
            </h2>
            <p className="text-sm t-text-sec">Sign in to your admin account</p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl mb-5 t-border"
              style={{
                background: "var(--danger-soft)",
                color: "var(--danger-text)",
                borderColor: "var(--danger-border)",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2 t-text-muted">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter email here"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full t-elevated border t-border rounded-xl px-4 py-3 text-sm outline-none focus:border-(--accent-border) focus:ring-2 focus:ring-(--accent-soft) t-text"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2 t-text-muted">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter password here"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full t-elevated border t-border rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-(--accent-border) focus:ring-2 focus:ring-(--accent-soft) t-text"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 t-text-muted cursor-pointer hover:t-text"
                >
                  {showPassword ? (
                    <FaEyeSlash size={13} />
                  ) : (
                    <FaEye size={13} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-4 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: "var(--accent)",
                color: "#fff",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo */}
          <div className="mt-6 t-card rounded-xl px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2 t-text-muted">
              Demo Credentials
            </p>
            <p className="text-xs font-mono leading-relaxed t-text-sec">
              Email: superadmin@gmail.com <br />
              Password: admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
