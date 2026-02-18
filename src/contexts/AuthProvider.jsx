import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./AuthContextBase";
import api from "../lib/axios";
import { tokenStorage } from "../utils/tokenStorage";

export default function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => tokenStorage.get());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((newToken) => {
    if (newToken) {
      tokenStorage.set(newToken);
    } else {
      tokenStorage.remove();
    }
    setTokenState(newToken);
  }, []);

  // Hydrate user from token on mount or token change
  useEffect(() => {
    let ignore = false;
    
    async function run() {
      try {
        setLoading(true);
        
        // No token means no user - skip API call
        if (!token) {
          setUser(null);
          return;
        }
        
        // Use axios instance instead of fetch
        // This benefits from interceptors (auto token injection, 401 handling)
        const res = await api.get("/users/me");
        
        // Extract user from response data
        if (!ignore) {
          setUser(res.data?.data || res.data?.user || null);
        }
      } catch (err) {
        // Log error in development for debugging
        if (import.meta.env.DEV) {
          console.error("AuthProvider hydration error:", err);
        }
        
        // Axios interceptor already removed token and redirected on 401
        // Just clear local state
        if (!ignore) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    
    run();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      ignore = true;
    };
  }, [token, setToken]);

  // Email and password login
  const login = useCallback(async (email, password) => {
    // Use axios instance for consistent error handling
    const res = await api.post("/auth/login", { email, password });
    
    // Extract token and user from response
    const { token: newToken, user: newUser } = res.data;
    
    // Update state using the wrapper function
    setToken(newToken);
    setUser(newUser);
  }, [setToken]);

  // Signup (returns response but doesn't auto-login)
  // User should be redirected to /check-email after signup
  const signup = useCallback(async (payload) => {
    // Use axios instance for consistent error handling
    const res = await api.post("/auth/signup", payload);
    
    // Return the full response data for caller to handle
    return res.data;
  }, []);

  // Logout function clears token and user state
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken]);


  return (
    <AuthContext.Provider 
      value={{ 
        token, 
        user, 
        loading, 
        login, 
        signup, 
        logout,
        setToken,  
        setUser    
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}