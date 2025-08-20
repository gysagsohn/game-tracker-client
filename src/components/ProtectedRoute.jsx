import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

export default function ProtectedRoute() {
  const { token, loading } = useAuth();
  if (loading) return <div className="p-6 text-center">Loading…</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}