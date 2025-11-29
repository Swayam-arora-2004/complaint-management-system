import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'user' | 'support_agent' | 'admin';
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireRole, requireAdmin }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Prevent admins from accessing user routes
  if (!requireAdmin && (user?.role === 'admin' || user?.role === 'support_agent')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Prevent users from accessing admin routes
  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'support_agent') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireRole && user?.role !== requireRole && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

