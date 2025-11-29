import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect based on role
        const isAdmin = user?.role === 'admin' || user?.role === 'support_agent';
        if (isAdmin) {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        // Not authenticated, redirect to login
        navigate("/auth", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // This should not render, but just in case
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
};

export default Index;
