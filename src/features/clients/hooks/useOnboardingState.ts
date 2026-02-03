import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
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
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch coach onboarding state
 * Uses centralized auth context - no redundant getSession() calls
 * Now exposes isError and refetch for error handling
 */
export function useOnboardingState(): OnboardingState {
  const { userId, isLoading: authLoading } = useAuth();

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
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });

  // Coordinated loading state
  const isLoading = authLoading || onboardingQuery.isLoading;

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
    isError: onboardingQuery.isError,
    error: onboardingQuery.error,
    refetch: onboardingQuery.refetch,
  };
}
