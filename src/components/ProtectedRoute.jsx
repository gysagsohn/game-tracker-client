import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

export default function ProtectedRoute() {
  const { token, loading } = useAuth();
  

  if (loading) return null;
  
  if (!token) return <Navigate to="/login" replace />;
  
  return <Outlet />;
}