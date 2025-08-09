import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // Auto-logout on invalid/expired token
      localStorage.removeItem("token");
      // Soft redirect without importing router here
      if (typeof window !== "undefined") {
        const isOnAuthPage = /\/login|\/signup/.test(window.location.pathname);
        if (!isOnAuthPage) window.location.assign("/login");
      }
    }
    const msg = err?.response?.data?.message || err.message || "Request failed";
    return Promise.reject(new Error(msg));
  }
);

export default api;