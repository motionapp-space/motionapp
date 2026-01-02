import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TopbarProvider } from "@/contexts/TopbarContext";
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
import ClientAuth from "./pages/client/ClientAuth";
import ClientHome from "./pages/client/ClientHome";
import ClientWorkouts from "./pages/client/ClientWorkouts";
import ClientAppointments from "./pages/client/ClientAppointments";
import ClientAllAppointments from "./pages/client/ClientAllAppointments";
import ClientAppLayout from "./components/client/ClientAppLayout";
import CoachLayout from "./components/CoachLayout";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useSessionStore } from "@/stores/useSessionStore";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRef } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);
  const { fetchActiveSession, startPolling, stopPolling } = useSessionStore();

  // Auth state initialization - runs ONCE on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      previousUserIdRef.current = currentUser?.id ?? null;
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      
      // Clear React Query cache only when user actually changes
      if (previousUserIdRef.current !== (newUser?.id ?? null)) {
        queryClient.clear();
        previousUserIdRef.current = newUser?.id ?? null;
      }
      
      setUser(newUser);
    });

    return () => subscription.unsubscribe();
  }, []); // NO dependencies - runs once on mount

  // Initialize session store when user logs in (only for coaches, not clients)
  useEffect(() => {
    if (!user) {
      stopPolling();
      return;
    }

    let cancelled = false;

    const initializeForCoach = async () => {
      // Check user role from user_roles table (Unified Identity pattern)
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      // Only coaches should fetch active session and start polling
      if (roleData?.role === 'coach') {
        fetchActiveSession();
        startPolling();
      }
    };

    initializeForCoach();

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [user?.id, fetchActiveSession, startPolling, stopPolling]);

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
          <ScrollToTop />
          <Routes>
            {/* Client area routes - always accessible, no coach auth required */}
            <Route path="/client/auth" element={<ClientAuth />} />
            <Route path="/client/app" element={<ClientAppLayout />}>
              <Route index element={<ClientHome />} />
              <Route path="workouts" element={<ClientWorkouts />} />
              <Route path="appointments" element={<ClientAppointments />} />
              <Route path="appointments/all" element={<ClientAllAppointments />} />
            </Route>

            {/* Public routes - accessible without authentication */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/share/:token" element={<SharedPlan />} />
            <Route path="/booking/:coachId" element={<ClientBooking />} />

            {/* Coach area routes - require authentication */}
            <Route element={<CoachLayout isAuthenticated={!!user} />}>
              <Route path="/" element={<Clients />} />
              <Route path="/library" element={<Library />} />
              <Route path="/templates" element={<Navigate to="/library?tab=templates" replace />} />
              <Route path="/templates/new" element={<TemplateEditor />} />
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
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;