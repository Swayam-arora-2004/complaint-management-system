import { Menu, Home, LayoutDashboard, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { useState } from "react";

interface HeaderProps {
  title: string;
  currentPage?: string;
  hideDashboardButton?: boolean;
  showSubmitButton?: boolean;
}

export const Header = ({ title, currentPage, hideDashboardButton, showSubmitButton }: HeaderProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'support_agent';
  
  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            {!isAdmin && (
              <button 
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground hover:text-primary transition-colors"
              >
                <Home className="h-5 w-5" />
                <span className="hidden sm:inline">{title}</span>
              </button>
            )}
            {isAdmin && (
              <div className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                <span className="hidden sm:inline">{title}</span>
              </div>
            )}
            {currentPage && (
              <nav className="hidden md:flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">
                  {currentPage}
                </span>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                {showSubmitButton && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/submit")}
                    className="hidden md:flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Submit Complaint
                  </Button>
                )}
                {!hideDashboardButton && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(isAdmin ? "/admin/dashboard" : "/dashboard")}
                    className="hidden md:flex items-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {isAdmin ? "Admin Dashboard" : "Dashboard"}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setProfileOpen(true)}
                  className="h-9 w-9"
                >
                  <User className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <ProfileSidebar open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
};
