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
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto pb-16">
            <Outlet />
          </main>
        </div>
        <StickySessionBar />
      </div>
    </TopbarProvider>
  );
};

export default CoachLayout;
