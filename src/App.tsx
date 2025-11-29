import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ComplaintDetail from "./pages/ComplaintDetail";
import SubmitComplaint from "./pages/SubmitComplaint";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import OAuthCallback from "./pages/OAuthCallback";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AdminComplaintDetail from "./pages/AdminComplaintDetail";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* User Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/complaint/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
              <Route path="/submit" element={<ProtectedRoute><SubmitComplaint /></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/complaint/:id" element={<ProtectedRoute requireAdmin><AdminComplaintDetail /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
