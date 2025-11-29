import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { googleLogin, appleLogin } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login: setAuthLogin } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
          const user = session.user;
          const provider = user.app_metadata?.provider || 'google';
          
          // Get user info
          const email = user.email || '';
          const name = user.user_metadata?.name || user.user_metadata?.full_name || email.split('@')[0];
          
          if (provider === 'google') {
            const googleId = user.id;
            const response = await googleLogin(googleId, email, name);
            
            if (response.ok && response.data?.token) {
              // Update auth context
              await setAuthLogin(response.data.token);
              // Get user role from response
              const userRole = response.data?.user?.role;
              toast({
                title: "Success",
                description: "Logged in with Google successfully!",
              });
              // Redirect based on role
              if (userRole === 'admin' || userRole === 'support_agent') {
                navigate("/admin/dashboard");
              } else {
                navigate("/dashboard");
              }
            } else {
              throw new Error(response.message || "Failed to login with Google");
            }
          } else if (provider === 'apple') {
            const appleId = user.id;
            const response = await appleLogin(appleId, email, name);
            
            if (response.ok && response.data?.token) {
              // Update auth context
              await setAuthLogin(response.data.token);
              // Get user role from response
              const userRole = response.data?.user?.role;
              toast({
                title: "Success",
                description: "Logged in with Apple successfully!",
              });
              // Redirect based on role
              if (userRole === 'admin' || userRole === 'support_agent') {
                navigate("/admin/dashboard");
              } else {
                navigate("/dashboard");
              }
            } else {
              throw new Error(response.message || "Failed to login with Apple");
            }
          }
        } else {
          // No session, redirect to login
          navigate("/auth");
        }
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to complete login",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    handleOAuthCallback();
  }, [navigate, toast, searchParams, setAuthLogin]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Completing login...</p>
    </div>
  );
}

