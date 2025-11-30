import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { googleLogin } from "@/lib/auth";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, login: setAuthLogin } = useAuth();

  useEffect(() => {
    // Check if there's an OAuth callback in the URL hash (Supabase redirects to root sometimes)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken && !isAuthenticated) {
      // Handle OAuth callback if we're on the root with hash
      const handleOAuth = async () => {
        try {
          console.log('Handling OAuth on Index page');
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });
          
          if (error) throw error;
          
          if (session?.user) {
            const user = session.user;
            const email = user.email || '';
            const name = user.user_metadata?.name || user.user_metadata?.full_name || email.split('@')[0];
            const providerId = user.user_metadata?.sub || user.user_metadata?.provider_id || user.id;
            
            const response = await googleLogin(providerId, email, name);
            if (response.ok && response.data?.token) {
              await setAuthLogin(response.data.token);
              window.history.replaceState(null, '', '/dashboard');
              navigate("/dashboard", { replace: true });
              return;
            }
          }
        } catch (error: any) {
          console.error('OAuth error on Index:', error);
          window.history.replaceState(null, '', '/auth');
          navigate("/auth", { replace: true });
        }
      };
      
      handleOAuth();
      return;
    }
    
    // Normal redirect logic
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
  }, [isAuthenticated, isLoading, user, navigate, setAuthLogin]);

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
