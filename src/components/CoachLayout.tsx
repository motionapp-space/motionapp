import { Outlet, Navigate, useLocation } from "react-router-dom";
import { TopbarProvider } from "@/contexts/TopbarContext";
import { AppSidebar } from "@/components/AppSidebar";
import { Topbar } from "@/components/Topbar";
import { StickySessionBar } from "@/components/StickySessionBar";
import { cn } from "@/lib/utils";

interface CoachLayoutProps {
  isAuthenticated: boolean;
}

const CoachLayout = ({ isAuthenticated }: CoachLayoutProps) => {
  const location = useLocation();
  // Only the main calendar/agenda view should have overflow-hidden (internal scroll)
  const isAgendaView = location.pathname === "/calendar";

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <TopbarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="relative flex flex-1 flex-col h-screen overflow-hidden">
          <Topbar />
          {/* Agenda keeps overflow-hidden for internal scroll, other pages get overflow-y-auto */}
          <main className={cn(
            "h-full",
            isAgendaView ? "overflow-hidden" : "overflow-y-auto"
          )}>
            <Outlet />
          </main>
        </div>
        <StickySessionBar />
      </div>
    </TopbarProvider>
  );
};

export default CoachLayout;
