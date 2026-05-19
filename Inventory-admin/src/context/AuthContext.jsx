import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

const API = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* check current login */
  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
      });

      setUser(res.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /* login */
  const login = async (formData) => {
    const res = await axios.post(`${API}/auth/login`, formData, {
      withCredentials: true,
    });

    setUser(res.data.user);

    return res.data.user;
  };

  /* logout */
  const logout = async () => {
    await axios.post(
      `${API}/auth/logout`,
      {},
      {
        withCredentials: true,
      },
    );

    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
