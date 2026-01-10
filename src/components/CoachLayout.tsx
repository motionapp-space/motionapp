import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { TopbarProvider } from "@/contexts/TopbarContext";
import { AppSidebar } from "@/components/AppSidebar";
import { Topbar } from "@/components/Topbar";
import { StickySessionBar } from "@/components/StickySessionBar";
import { MobileNav } from "@/components/MobileNav";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { cn } from "@/lib/utils";

interface CoachLayoutProps {
  isAuthenticated: boolean;
}

const CoachLayout = ({ isAuthenticated }: CoachLayoutProps) => {
  const location = useLocation();
  const { isDesktopLarge, isDesktopSmall, isTablet, isMobile } = useResponsiveLayout();
  
  // Off-canvas state for tablet/mobile
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Temporary expansion state for desktop-small
  const [isTemporarilyExpanded, setIsTemporarilyExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Only the main calendar/agenda view should have overflow-hidden (internal scroll)
  const isAgendaView = location.pathname === "/calendar";

  // Close temporary expansion when clicking outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      isTemporarilyExpanded &&
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target as Node)
    ) {
      setIsTemporarilyExpanded(false);
    }
  }, [isTemporarilyExpanded]);

  useEffect(() => {
    if (isTemporarilyExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isTemporarilyExpanded, handleClickOutside]);

  // Close temporary expansion on navigation
  const handleSidebarNavClick = useCallback(() => {
    if (isTemporarilyExpanded) {
      setIsTemporarilyExpanded(false);
    }
  }, [isTemporarilyExpanded]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Reset temporary expansion when breakpoint changes
  useEffect(() => {
    if (!isDesktopSmall) {
      setIsTemporarilyExpanded(false);
    }
  }, [isDesktopSmall]);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleMenuClick = () => {
    if (isDesktopSmall) {
      setIsTemporarilyExpanded((prev) => !prev);
    } else if (isTablet || isMobile) {
      setMobileNavOpen(true);
    }
  };

  // Show hamburger on desktop-small, tablet, and mobile
  const showMenuButton = isDesktopSmall || isTablet || isMobile;
  
  // Show sidebar on desktop-large and desktop-small
  const showSidebar = isDesktopLarge || isDesktopSmall;
  
  // Sidebar is collapsed on desktop-small (unless temporarily expanded)
  const sidebarCollapsed = isDesktopSmall && !isTemporarilyExpanded;

  return (
    <TopbarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar - desktop only */}
        {showSidebar && (
          <div ref={sidebarRef}>
            <AppSidebar 
              collapsed={sidebarCollapsed} 
              onNavClick={handleSidebarNavClick}
            />
          </div>
        )}

        {/* Main content area */}
        <div className="relative flex flex-1 flex-col h-screen overflow-hidden">
          <Topbar 
            showMenuButton={showMenuButton} 
            onMenuClick={handleMenuClick} 
          />
          <main
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
      </div>
    </TopbarProvider>
  );
};

export default CoachLayout;
