import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from URL query parameter
    // Try multiple ways to get the token
    let tokenParam = searchParams.get("token");
    
    // If not found in searchParams, try window.location.search
    if (!tokenParam) {
      const urlParams = new URLSearchParams(window.location.search);
      tokenParam = urlParams.get("token");
    }
    
    // If still not found, try window.location.hash (for some email clients)
    if (!tokenParam) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      tokenParam = hashParams.get("token");
    }
    
    // Debug logging
    console.log('Reset Password Page - Token Check:', {
      searchParams: searchParams.get("token"),
      windowSearch: new URLSearchParams(window.location.search).get("token"),
      windowHash: new URLSearchParams(window.location.hash.substring(1)).get("token"),
      fullUrl: window.location.href,
      tokenParam
    });
    
    if (tokenParam) {
      // Decode the token in case it was URL encoded
      const decodedToken = decodeURIComponent(tokenParam);
      setToken(decodedToken);
      console.log('Token found and set:', decodedToken.substring(0, 20) + '...');
    } else {
      // Don't show error immediately, let user try to enter token manually or show helpful message
      console.warn('No token found in URL');
    }
  }, [searchParams, navigate]);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: "Error",
        description: "No reset token found. Please use the link from your email.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
      
      console.log('Resetting password with token:', token ? token.substring(0, 20) + '...' : 'none');
      
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      
      console.log('Reset password response:', { status: response.status, ok: data.ok });

      if (!response.ok) {
        throw new Error(data.message || `Failed to reset password: ${response.status}`);
      }

      if (!data.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      toast({
        title: "Success",
        description: "Your password has been reset successfully! Redirecting to login...",
        duration: 3000,
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. The link may have expired. Please request a new one.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="COMPLAINT MANAGEMENT SYSTEM" />
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Reset Password
            </h1>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
            {!token && (
              <p className="text-sm text-destructive mt-2">
                No reset token found. Please use the link from your email.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            {!token ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  The reset link appears to be invalid or expired.
                </p>
                <Button onClick={() => navigate("/auth")} variant="outline">
                  Back to Login
                </Button>
              </div>
            ) : (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="text-sm text-primary hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

