import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type OnboardingStateType = 'ZERO_CLIENTS' | 'FIRST_CLIENT_NO_CONTENT' | 'ACTIVE_USER';

interface CoachOnboardingData {
  has_active_clients: boolean;
  has_archived_clients: boolean;
  has_any_plan: boolean;
  has_any_appointment: boolean;
}

export interface OnboardingState {
  state: OnboardingStateType;
  hasActiveClients: boolean;
  hasArchivedClients: boolean;
  hasAnyPlan: boolean;
  hasAnyAppointment: boolean;
  isLoading: boolean;
}

export function useOnboardingState(): OnboardingState {
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Get user ID from session (runs once)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Single RPC query for all onboarding data
  const onboardingQuery = useQuery({
    queryKey: ['coach-onboarding', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_coach_onboarding_data', {
        p_coach_id: userId
      });
      if (error) throw error;
      return data as unknown as CoachOnboardingData;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  // Loading state: includes auth pending + query loading
  const isPending = authLoading || !userId;
  const isLoading = isPending || onboardingQuery.isLoading;

  // Safe defaults
  const hasActiveClients = onboardingQuery.data?.has_active_clients ?? false;
  const hasArchivedClients = onboardingQuery.data?.has_archived_clients ?? false;
  const hasAnyPlan = onboardingQuery.data?.has_any_plan ?? false;
  const hasAnyAppointment = onboardingQuery.data?.has_any_appointment ?? false;

  // Determine onboarding state
  let state: OnboardingStateType;
  if (!hasActiveClients) {
    state = 'ZERO_CLIENTS';
  } else if (!hasAnyPlan && !hasAnyAppointment) {
    state = 'FIRST_CLIENT_NO_CONTENT';
  } else {
    state = 'ACTIVE_USER';
  }

  return {
    state,
    hasActiveClients,
    hasArchivedClients,
    hasAnyPlan,
    hasAnyAppointment,
    isLoading,
  };
}
