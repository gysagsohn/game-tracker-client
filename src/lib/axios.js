import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize API errors + auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      localStorage.removeItem("token");
      if (typeof window !== "undefined") {
        const path = window.location.pathname || "";
        const onAuth = /\/login|\/signup/i.test(path);
        if (!onAuth) window.location.assign("/login");
      }
    }
    const msg = err?.response?.data?.message || err.message || "Request failed";
    return Promise.reject(new Error(msg));
  }
);

export default api;
