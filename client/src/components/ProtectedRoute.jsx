import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-base-200 border-t-accent-400 rounded-full animate-spin" />
          <p className="text-base-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
