import { User, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ProfileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileSidebar = ({ open, onOpenChange }: ProfileSidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Profile</SheetTitle>
          <SheetDescription>
            Your account information and settings
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-8 space-y-6">
          {/* Profile Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {user.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                User ID
              </p>
              <p className="text-sm text-foreground font-mono">
                {user.id}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                logout();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

