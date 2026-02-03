import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import Notifications from "./pages/Notifications";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInvites from "./pages/admin/AdminInvites";
import ClientAuth from "./pages/client/ClientAuth";
import ClientAcceptInvite from "./pages/client/ClientAcceptInvite";
import ClientHome from "./pages/client/ClientHome";
import ClientWorkouts from "./pages/client/ClientWorkouts";
import ClientLiveSession from "./pages/client/ClientLiveSession";
import ClientAppointments from "./pages/client/ClientAppointments";
import ClientAllAppointments from "./pages/client/ClientAllAppointments";
import ClientNotifications from "./pages/client/ClientNotifications";
import ClientAppLayout from "./components/client/ClientAppLayout";
import ClientSessionLayout from "./components/client/ClientSessionLayout";
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
  // Pre-fetches roles to populate cache before unlocking UI
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      
      setUser(currentUser);
      previousUserIdRef.current = currentUser?.id ?? null;
      
      if (currentUser) {
        // Pre-fetch roles and populate React Query cache
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id);
        
        const roleStrings = roles?.map(r => r.role) || [];
        
        // Populate cache so useUserRoles() finds data immediately
        queryClient.setQueryData(["userRoles", currentUser.id], roleStrings);
        
        // Set coach flag for session bridge
        const hasCoachRole = roleStrings.includes('coach');
        setIsCoach(hasCoachRole);
      }
      
      setLoading(false);
    };
    
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      
      // Clear React Query cache only when user actually changes
      if (previousUserIdRef.current !== (newUser?.id ?? null)) {
        queryClient.clear();
        previousUserIdRef.current = newUser?.id ?? null;
        
        if (newUser) {
          // Re-fetch roles for new user
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", newUser.id);
          
          const roleStrings = roles?.map(r => r.role) || [];
          queryClient.setQueryData(["userRoles", newUser.id], roleStrings);
          
          setIsCoach(roleStrings.includes('coach'));
        } else {
          setIsCoach(false);
        }
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
          <AuthProvider user={user} isLoading={loading}>
            <ScrollToTop />
            {/* Initialize session bridge for coaches - outside Routes */}
            {isCoach && user && <CoachSessionInitializer userId={user.id} />}
            <Routes>
              {/* Client area routes - always accessible, no coach auth required */}
              <Route path="/client/auth" element={<ClientAuth />} />
              <Route path="/client/accept-invite" element={<ClientAcceptInvite />} />
              
              {/* Live session - immersive layout (BEFORE /client/app for correct matching) */}
              <Route path="/client/app/session" element={<ClientSessionLayout />}>
                <Route index element={<ClientLiveSession />} />
              </Route>
              
              {/* Client app - standard layout */}
              <Route path="/client/app" element={<ClientAppLayout />}>
                <Route index element={<Navigate to="workouts" replace />} />
              <Route path="workouts" element={<ClientWorkouts />} />
                <Route path="appointments" element={<ClientAppointments />} />
                <Route path="appointments/all" element={<ClientAllAppointments />} />
                <Route path="notifications" element={<ClientNotifications />} />
              </Route>

              {/* Public routes - accessible without authentication */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/share/:token" element={<SharedPlan />} />
              <Route path="/booking/:coachId" element={<ClientBooking />} />

              {/* Admin area routes - require admin role */}
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/invites" element={<AdminInvites />} />
              </Route>

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
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/session/live" element={<LiveSession />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;