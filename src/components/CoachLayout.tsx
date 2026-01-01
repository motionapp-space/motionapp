import { Outlet, Navigate } from "react-router-dom";
import { TopbarProvider } from "@/contexts/TopbarContext";
import { AppSidebar } from "@/components/AppSidebar";
import { Topbar } from "@/components/Topbar";
import { StickySessionBar } from "@/components/StickySessionBar";

interface CoachLayoutProps {
  isAuthenticated: boolean;
}

const CoachLayout = ({ isAuthenticated }: CoachLayoutProps) => {
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <TopbarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="relative flex flex-1 flex-col h-screen overflow-hidden">
          <Topbar />
          {/* pt-16 is the ONLY vertical offset (64px for topbar) */}
          <main className="pt-16 h-full overflow-hidden">
            <Outlet />
          </main>
        </div>
        <StickySessionBar />
      </div>
    </TopbarProvider>
  );
};

export default CoachLayout;
