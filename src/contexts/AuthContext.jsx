
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/axios";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Bootstrap session if token exists
  useEffect(() => {
    async function bootstrap() {
      try {
        if (token) {
          // ensure axios carries the token for this session
          api.defaults.headers.Authorization = `Bearer ${token}`;
          const res = await api.get("/users/me");
          setUser(res.data?.data || res.data);
        } else {
          delete api.defaults.headers.Authorization;
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

  // Login with JSON body
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const payload = res.data?.data || res.data;
    const t = payload?.token;
    if (t) {
      localStorage.setItem("token", t);
      setToken(t);
      api.defaults.headers.Authorization = `Bearer ${t}`;
    }
    if (payload?.user) setUser(payload.user);
    return payload;
  };

  // Signup expects a single object { firstName, lastName, email, password }
  const signup = async ({ firstName, lastName, email, password }) => {
    const res = await api.post("/auth/signup", {
      firstName,
      lastName,
      email,
      password,
    });
    return res.data?.data || res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete api.defaults.headers.Authorization;
  };

  const value = useMemo(
    () => ({ user, token, loading, login, signup, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
