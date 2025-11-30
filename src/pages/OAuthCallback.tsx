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
        console.log('OAuth callback triggered');
        console.log('Current URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        
        // Parse hash parameters from URL (Supabase OAuth returns tokens in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        console.log('Access token found:', !!accessToken);
        
        if (!accessToken) {
          console.log('No access token in hash, checking existing session...');
          // Try to get existing session
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          if (existingSession?.user) {
            console.log('Found existing session');
            const user = existingSession.user;
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
          console.error("No access token found in URL hash");
          navigate("/auth", { replace: true });
          return;
        }
        
        // Set the session using tokens from URL hash
        console.log('Setting Supabase session...');
        const { data: { session: newSession }, error: setError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        
        if (setError) {
          console.error('Error setting session:', setError);
          throw setError;
        }
        
        if (!newSession?.user) {
          console.error("No user in session after setting");
          navigate("/auth", { replace: true });
          return;
        }
        
        const user = newSession.user;
        console.log('User from session:', {
          email: user.email,
          metadata: user.user_metadata,
          app_metadata: user.app_metadata
        });
        
        // Get user info from Supabase user object
        const email = user.email || '';
        const name = user.user_metadata?.name || user.user_metadata?.full_name || email.split('@')[0];
        
        // Get provider ID - Google uses sub in user_metadata
        const providerId = user.user_metadata?.sub || 
                          user.user_metadata?.provider_id || 
                          user.id;
        
        console.log('Calling backend with:', { providerId, email, name });
        
        // Call backend to login/create user
        const response = await googleLogin(providerId, email, name);
        console.log('Backend response:', response);
        
        if (response.ok && response.data?.token) {
          await setAuthLogin(response.data.token);
          const userRole = response.data?.user?.role;
          
          // Clear the hash from URL immediately
          window.history.replaceState(null, '', '/dashboard');
          
          toast({
            title: "Success",
            description: "Logged in with Google successfully!",
          });
          
          // Redirect based on role
          if (userRole === 'admin' || userRole === 'support_agent') {
            navigate("/admin/dashboard", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        } else {
          throw new Error(response.message || "Failed to login with Google");
        }
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to complete login",
          variant: "destructive",
        });
        // Clear hash and redirect
        window.history.replaceState(null, '', '/auth');
        navigate("/auth", { replace: true });
      }
    };

    // Handle OAuth callback immediately
    handleOAuthCallback();
  }, [navigate, toast, setAuthLogin]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Completing login...</p>
    </div>
  );
}

