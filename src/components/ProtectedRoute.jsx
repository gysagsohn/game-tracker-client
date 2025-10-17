import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import Skeleton from "../components/ui/Skeleton";

export default function ProtectedRoute() {
  const { token, loading } = useAuth();
  

  if (loading) {
    return (
      <div className="min-h-[40vh] grid place-items-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton variant="title" className="w-40 mx-auto" />
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-5/6 h-10 mx-auto" />
          <Skeleton variant="button" className="w-32 mx-auto" />
        </div>
      </div>
    );
  }
  
  if (!token) return <Navigate to="/login" replace />;
  
  return <Outlet />;
}