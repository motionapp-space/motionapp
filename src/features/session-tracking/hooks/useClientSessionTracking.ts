/**
 * Client Session Tracking Hooks
 * 
 * React Query hooks for client-side session management.
 * Uses the client adapter and service layer.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientSessionTrackingAdapter } from '../adapters/clientSessionTrackingAdapter';
import { 
  createSessionTrackingService, 
  type StartSessionParams, 
  type CompleteSetParams,
  type CompleteSupersetSeriesParams,
} from '../services/sessionTrackingService';

// Create service instance with client adapter
const service = createSessionTrackingService(clientSessionTrackingAdapter);

// ================== Query Keys ==================

export const CLIENT_SESSION_KEYS = {
  all: ['clientSessionTracking'] as const,
  active: ['clientSessionTracking', 'active'] as const,
  detail: (id: string) => ['clientSessionTracking', 'detail', id] as const,
  actuals: (sessionId: string) => ['clientSessionTracking', 'actuals', sessionId] as const,
};

// ================== Query Hooks ==================

/**
 * Get currently active client session
 */
export function useClientActiveSession() {
  return useQuery({
    queryKey: CLIENT_SESSION_KEYS.active,
    queryFn: () => service.getActiveSession(),
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Get session detail by ID (includes plan_day_snapshot)
 */
export function useClientSessionDetail(sessionId: string | undefined) {
  return useQuery({
    queryKey: CLIENT_SESSION_KEYS.detail(sessionId!),
    queryFn: () => service.getSessionDetail(sessionId!),
    enabled: !!sessionId,
  });
}

/**
 * Get actuals for a session
 */
export function useClientSessionActuals(sessionId: string | undefined) {
  return useQuery({
    queryKey: CLIENT_SESSION_KEYS.actuals(sessionId!),
    queryFn: () => service.listActuals(sessionId!),
    enabled: !!sessionId,
    staleTime: 10_000, // 10 seconds - actuals change frequently
  });
}

// ================== Mutation Hooks ==================

/**
 * Start a new client session
 */
export function useStartClientSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: StartSessionParams) => service.startClientSession(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.active });
    },
  });
}

/**
 * Complete a set (record actual)
 */
export function useCompleteClientSet(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CompleteSetParams['input']) =>
      service.completeSet({ sessionId, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.actuals(sessionId) });
    },
  });
}

/**
 * Undo last set for an exercise
 */
export function useUndoClientLastSet(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exerciseId: string) =>
      service.undoLastSet({ sessionId, exerciseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.actuals(sessionId) });
    },
  });
}

/**
 * Finish (complete) the session
 */
export function useFinishClientSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, notes }: { sessionId: string; notes?: string }) =>
      service.finishSession({ sessionId, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.all });
    },
  });
}

/**
 * Discard (abandon) the session
 */
export function useDiscardClientSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => service.discardSession({ sessionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.all });
    },
  });
}

/**
 * Complete a superset/circuit series (batch create actuals)
 */
export function useCompleteSupersetSeries(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inputs: CompleteSupersetSeriesParams['inputs']) =>
      service.completeSupersetSeries({ sessionId, inputs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.actuals(sessionId) });
    },
  });
}

/**
 * Undo last series for a superset/circuit
 */
export function useUndoSupersetLastSeries(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exerciseIds: string[]) =>
      service.undoSupersetLastSeries({ sessionId, exerciseIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.actuals(sessionId) });
    },
  });
}
