import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/axios";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        if (token) {
          const res = await api.get("/users/me");
          setUser(res.data?.data || res.data);
        }
      } catch (e) {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const payload = res.data?.data || res.data;
    const t = payload?.token;
    if (t) {
      localStorage.setItem("token", t);
      setToken(t);
    }
    if (payload?.user) setUser(payload.user);
    return payload;
  };

  const signup = async (body) => {
    const res = await api.post("/auth/signup", body);
    return res.data?.data || res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, loading, login, signup, logout }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}