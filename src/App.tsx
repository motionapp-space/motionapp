import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TopbarProvider } from "@/contexts/TopbarContext";
import { supabase } from "@/integrations/supabase/client";
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
import { useSessionBridge } from "@/hooks/useSessionBridge";

// Componente separato per inizializzare il bridge sessioni per i coach
function CoachSessionInitializer({ userId }: { userId: string }) {
  useSessionBridge(userId);
  return null;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);
  const [isCoach, setIsCoach] = useState(false);

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

  // Check if user is coach
  useEffect(() => {
    if (!user) {
      setIsCoach(false);
      return;
    }

    const checkRole = async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      // User is coach if they have the 'coach' role (handles multiple roles)
      const hasCoachRole = roles?.some(r => r.role === 'coach') ?? false;
      setIsCoach(hasCoachRole);
    };

    checkRole();
  }, [user?.id]);

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
          {/* Initialize session bridge for coaches - outside Routes */}
          {isCoach && user && <CoachSessionInitializer userId={user.id} />}
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
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;