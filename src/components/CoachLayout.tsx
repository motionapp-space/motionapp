import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { TopbarProvider } from "@/contexts/TopbarContext";
import { AppSidebar } from "@/components/AppSidebar";
import { Topbar } from "@/components/Topbar";
import { StickySessionBar } from "@/components/StickySessionBar";
import { MobileNav } from "@/components/MobileNav";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useUserRoles } from "@/features/auth/hooks/useUserRoles";
import { cn } from "@/lib/utils";

interface CoachLayoutProps {
  isAuthenticated: boolean;
}

const CoachLayout = ({ isAuthenticated }: CoachLayoutProps) => {
  const location = useLocation();
  const { isDesktopLarge, isDesktopSmall, isTablet, isMobile } = useResponsiveLayout();
  const { isCoach, isClient, isLoading: rolesLoading } = useUserRoles();
  
  // Off-canvas state for tablet/mobile only
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Only the main calendar/agenda view should have overflow-hidden (internal scroll)
  const isAgendaView = location.pathname === "/calendar";

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Not authenticated - redirect to auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Roles are pre-loaded in App.tsx, so rolesLoading should be false immediately
  // Keep as fallback only for edge cases (direct navigation, etc.)
  if (rolesLoading) {
    return null; // Return nothing - App.tsx spinner handles this
  }

  // Not a coach - redirect appropriately
  if (!isCoach) {
    // If they're a client, send to client app
    if (isClient) {
      return <Navigate to="/client/app" replace />;
    }
    // Otherwise to auth
    return <Navigate to="/auth" replace />;
  }

  const handleMenuClick = () => {
    if (isTablet || isMobile) {
      setMobileNavOpen(true);
    }
  };

  // Show hamburger ONLY on tablet and mobile (not desktop-small)
  const showMenuButton = isTablet || isMobile;
  
  // Show sidebar on desktop-large and desktop-small
  const showSidebar = isDesktopLarge || isDesktopSmall;
  
  // Sidebar is always collapsed on desktop-small (no temporary expansion)
  const sidebarCollapsed = isDesktopSmall;

  return (
    <TopbarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar - desktop only */}
        {showSidebar && (
          <AppSidebar collapsed={sidebarCollapsed} />
        )}

        {/* Main content area */}
        <div className="relative flex flex-1 flex-col h-screen overflow-hidden">
          <Topbar 
            showMenuButton={showMenuButton} 
            onMenuClick={handleMenuClick} 
          />
          <main
            id="coach-scroll-container"
            className={cn(
              "h-full",
              isAgendaView ? "overflow-hidden" : "overflow-y-auto"
            )}
          >
            <Outlet />
          </main>
        </div>

        <StickySessionBar />

        {/* Off-canvas navigation for tablet/mobile */}
        {(isTablet || isMobile) && (
          <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
        )}

        {/* Feedback floating button */}
        <FeedbackWidget />
      </div>
    </TopbarProvider>
  );
};

export default CoachLayout;
