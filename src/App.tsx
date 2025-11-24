import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Plans from "./pages/Plans";
import Library from "./pages/Library";
import TemplateEditor from "./pages/TemplateEditor";
import TemplateDetail from "./pages/TemplateDetail";
import TemplateMissing from "./pages/TemplateMissing";
import ClientPlanEditor from "./pages/ClientPlanEditor";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Calendar from "./pages/Calendar";
import BookingManagement from "./pages/BookingManagement";
import ClientBooking from "./pages/ClientBooking";
import LiveSession from "./pages/LiveSession";
import Settings from "./pages/Settings";
import SharedPlan from "./pages/SharedPlan";
import NotFound from "./pages/NotFound";
import { AppSidebar } from "@/components/AppSidebar";
import { Topbar } from "@/components/Topbar";
import { StickySessionBar } from "@/components/StickySessionBar";
import { useSessionStore } from "@/stores/useSessionStore";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchActiveSession, fetchUpcomingEvent, startPolling, stopPolling } = useSessionStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize session store when user logs in
  useEffect(() => {
    if (user) {
      fetchActiveSession();
      fetchUpcomingEvent();
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [user, fetchActiveSession, fetchUpcomingEvent, startPolling, stopPolling]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {user ? (
            <div className="flex min-h-screen w-full flex-col">
              <Topbar />
              <div className="flex flex-1">
                <AppSidebar />
                <main className="flex-1 overflow-y-auto pb-16">
                  <Routes>
                    <Route path="/" element={<Clients />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/templates" element={<Navigate to="/library?tab=templates" replace />} />
                    <Route path="/templates/:id" element={<TemplateDetail />} />
                    <Route path="/templates/:id/edit" element={<TemplateEditor />} />
                    <Route path="/templates/:id/missing" element={<TemplateMissing />} />
                    <Route path="/client-plans/new" element={<ClientPlanEditor />} />
                    <Route path="/client-plans/:id/edit" element={<ClientPlanEditor />} />
                    <Route path="/clients/:id" element={<ClientDetail />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/calendar/manage" element={<BookingManagement />} />
                    <Route path="/session/live" element={<LiveSession />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
              <StickySessionBar />
            </div>
          ) : (
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/share/:token" element={<SharedPlan />} />
              <Route path="/booking/:coachId" element={<ClientBooking />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;