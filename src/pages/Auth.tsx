import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Chrome, Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { register, login, googleLogin, appleLogin } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function Auth() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login: setAuthLogin, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect based on role
      const isAdmin = user?.role === 'admin' || user?.role === 'support_agent';
      if (isAdmin) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const emailOrUsername = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await login(emailOrUsername, password);

      if (!response.ok) {
        throw new Error(response.message || "Failed to sign in");
      }

      if (response.data?.token) {
        await setAuthLogin(response.data.token);
        
        // Redirect based on role
        const userRole = response.data.user?.role;
        if (userRole === 'admin' || userRole === 'support_agent') {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await register(name, email, password);

      if (!response.ok) {
        throw new Error(response.message || "Failed to create account");
      }

      if (response.data?.token) {
        await setAuthLogin(response.data.token);
        // New signups are always regular users, redirect to user dashboard
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      setIsLoading(true);
      
      // Use Supabase OAuth to get user info, then send to backend
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/oauth/callback`,
        },
      });
      
      if (error) throw error;

      // OAuth will redirect to /oauth/callback which will handle the backend integration
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with " + provider,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
      
      console.log('Requesting password reset for:', resetEmail);
      
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      const data = await response.json();
      
      console.log('Password reset response:', data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to send password reset email");
      }

      if (!data.ok) {
        throw new Error(data.message || "Failed to send password reset email");
      }

      toast({
        title: "Password Reset Email Sent",
        description: data.message || "Please check your email (including spam folder) for the password reset link.",
        duration: 6000,
      });
      
      setForgotPasswordOpen(false);
      setResetEmail("");
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            COMPLAINT MANAGEMENT SYSTEM
          </h1>
          <p className="text-muted-foreground">
            Sign in to manage your complaints
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div className="rounded-lg border border-border bg-card p-6">
              <form className="space-y-4" onSubmit={handleEmailLogin}>
                <div>
                  <Label htmlFor="email">Email or Username</Label>
                  <Input 
                    id="email"
                    name="email"
                    type="text"
                    placeholder="your.email@example.com"
                    className="mt-2"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="mt-2"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    type="button" 
                    className="w-full"
                    onClick={() => handleSocialLogin('google')}
                  >
                    <Chrome className="h-4 w-4 mr-2" />
                    Google
                  </Button>
                  <Button 
                    variant="outline" 
                    type="button" 
                    className="w-full"
                    onClick={() => handleSocialLogin('apple')}
                  >
                    <Apple className="h-4 w-4 mr-2" />
                    Apple
                  </Button>
                </div>

                <div className="text-center mt-4">
                  <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          setForgotPasswordOpen(true);
                        }}
                      >
                        Forgot password?
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your email address and we'll send you a link to reset your password.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleForgotPassword}>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              className="mt-2"
                              required
                              disabled={isResetting}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setForgotPasswordOpen(false);
                              setResetEmail("");
                            }}
                            disabled={isResetting}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isResetting}>
                            {isResetting ? "Sending..." : "Send Reset Link"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="signup">
            <div className="rounded-lg border border-border bg-card p-6">
              <form className="space-y-4" onSubmit={handleEmailSignup}>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    className="mt-2"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="mt-2"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password"
                    name="signup-password"
                    type="password"
                    placeholder="Create a password"
                    className="mt-2"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input 
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    className="mt-2"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    type="button" 
                    className="w-full"
                    onClick={() => handleSocialLogin('google')}
                    disabled={isLoading}
                  >
                    <Chrome className="h-4 w-4 mr-2" />
                    Google
                  </Button>
                  <Button 
                    variant="outline" 
                    type="button" 
                    className="w-full"
                    onClick={() => handleSocialLogin('apple')}
                    disabled={isLoading}
                  >
                    <Apple className="h-4 w-4 mr-2" />
                    Apple
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
