// src/contexts/AuthContext.jsx
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // hydrate user from token
  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        setLoading(true);
        if (!token) {
          setUser(null);
          return;
        }
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Session expired. Please sign in again.");
        const json = await res.json();
        if (!ignore) setUser(json?.data || json?.user || null);
      } catch {
        localStorage.removeItem("token");
        if (!ignore) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => { ignore = true; };
  }, [token]);

  // email+password login
  const login = useCallback(async (email, password) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || "Login failed");
    localStorage.setItem("token", json.token);
    setToken(json.token);
    setUser(json.user);
  }, []);

  // signup (returns 201 and sends verify email; you’ll route to /check-email)
  const signup = useCallback(async (payload) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || "Signup failed");
    // server currently returns token + user; we don't auto-login until email is verified
    return json;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ token, user, loading, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
