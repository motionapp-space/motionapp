/**
 * Client Session Store (with localStorage persistence)
 * 
 * Manages runtime session state for clients.
 * Separate from coach session store to prevent data interference.
 * 
 * Persistence ensures session survives:
 * - Page refreshes
 * - Tab switches
 * - Browser restarts (within reason)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { computeElapsedSeconds } from '@/features/session-tracking/core/elapsed';

interface DraftValue {
  reps?: string;
  load?: string;
  touchedAtMs: number;
}

interface ClientSessionState {
  // Session identity
  activeSessionId: string | null;
  
  // Timing (all in milliseconds)
  startedAtMs: number | null;
  pausedAtMs: number | null;
  accumulatedPauseMs: number;
  
  // State flags
  isPaused: boolean;
  
  // Rest timer (per gruppo, non esercizio)
  restTimerEndMs: number | null;
  restTimerGroupId: string | null;
  
  // Step navigation
  currentGroupIndex: number;
  totalGroups: number;
  
  // Draft inputs (persist between group changes)
  draftByExerciseId: Record<string, DraftValue>;
  updatedAtMs: number | null;
  persistVersion: number;
}

interface ClientSessionActions {
  /**
   * Start tracking a session
   */
  start: (sessionId: string, startedAtMs: number) => void;
  
  /**
   * Pause the session timer
   */
  pause: () => void;
  
  /**
   * Resume from pause
   */
  resume: () => void;
  
  /**
   * Clear all session state (on finish/discard)
   */
  clear: () => void;
  
  /**
   * Get current elapsed seconds (computed)
   */
  getElapsedSeconds: () => number;
  
  /**
   * Sync store with an existing session (e.g., after page refresh)
   */
  syncWithSession: (sessionId: string, startedAt: string) => void;
  
  /**
   * Start rest timer for a group (superset/circuit/single)
   */
  startRestTimer: (durationSeconds: number, groupId: string) => void;
  
  /**
   * Clear rest timer
   */
  clearRestTimer: () => void;
  
  /**
   * Get remaining rest seconds (negative if overtime)
   */
  getRemainingRestSeconds: () => number;
  
  /**
   * Check if rest timer is active
   */
  isRestActive: () => boolean;
  
  /**
   * Set current group index (with bounds check)
   */
  setCurrentGroupIndex: (index: number) => void;
  
  /**
   * Navigate to next group
   */
  nextGroup: () => void;
  
  /**
   * Navigate to previous group
   */
  prevGroup: () => void;
  
  /**
   * Set total groups count
   */
  setTotalGroups: (count: number) => void;
  
  /**
   * Reset navigation state
   */
  resetNavigation: () => void;
  
  /**
   * Touch: update updatedAtMs timestamp
   */
  touch: () => void;
  
  /**
   * Set draft for a specific exercise
   */
  setDraft: (exerciseId: string, patch: { reps?: string; load?: string }) => void;
  
  /**
   * Clear all drafts
   */
  clearDraft: () => void;
}

const initialState: ClientSessionState = {
  activeSessionId: null,
  startedAtMs: null,
  pausedAtMs: null,
  accumulatedPauseMs: 0,
  isPaused: false,
  restTimerEndMs: null,
  restTimerGroupId: null,
  currentGroupIndex: 0,
  totalGroups: 0,
  draftByExerciseId: {},
  updatedAtMs: null,
  persistVersion: 1,
};

export const useClientSessionStore = create<ClientSessionState & ClientSessionActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      start: (sessionId, startedAtMs) =>
        set({
          activeSessionId: sessionId,
          startedAtMs,
          pausedAtMs: null,
          accumulatedPauseMs: 0,
          isPaused: false,
        }),

      pause: () => {
        const { isPaused } = get();
        if (isPaused) return; // Already paused
        
        set({
          pausedAtMs: Date.now(),
          isPaused: true,
        });
      },

      resume: () => {
        const { pausedAtMs, accumulatedPauseMs, isPaused } = get();
        if (!isPaused || !pausedAtMs) return;
        
        const pauseDuration = Date.now() - pausedAtMs;
        set({
          pausedAtMs: null,
          accumulatedPauseMs: accumulatedPauseMs + pauseDuration,
          isPaused: false,
        });
      },

      clear: () => set(initialState),

      getElapsedSeconds: () => {
        const { startedAtMs, pausedAtMs, accumulatedPauseMs } = get();
        if (!startedAtMs) return 0;

        return computeElapsedSeconds({
          startedAtMs,
          pausedAtMs,
          accumulatedPauseMs,
          nowMs: Date.now(),
        });
      },

      syncWithSession: (sessionId, startedAt) => {
        const { activeSessionId } = get();
        
        // Already tracking this session
        if (activeSessionId === sessionId) return;
        
        // Sync with the session's start time
        const startedAtMs = new Date(startedAt).getTime();
        set({
          activeSessionId: sessionId,
          startedAtMs,
          pausedAtMs: null,
          accumulatedPauseMs: 0,
          isPaused: false,
        });
      },

      startRestTimer: (durationSeconds, groupId) => {
        set({
          restTimerEndMs: Date.now() + durationSeconds * 1000,
          restTimerGroupId: groupId,
        });
      },

      clearRestTimer: () => {
        set({
          restTimerEndMs: null,
          restTimerGroupId: null,
        });
      },

      getRemainingRestSeconds: () => {
        const { restTimerEndMs } = get();
        if (!restTimerEndMs) return 0;
        return Math.floor((restTimerEndMs - Date.now()) / 1000);
      },

      isRestActive: () => {
        const { restTimerEndMs } = get();
        return restTimerEndMs !== null;
      },

      setCurrentGroupIndex: (index) => {
        const { totalGroups } = get();
        if (totalGroups === 0) {
          set({ currentGroupIndex: 0 });
          return;
        }
        const bounded = Math.max(0, Math.min(index, totalGroups - 1));
        set({ currentGroupIndex: bounded });
      },

      nextGroup: () => {
        const { currentGroupIndex, totalGroups } = get();
        if (currentGroupIndex < totalGroups - 1) {
          set({ currentGroupIndex: currentGroupIndex + 1 });
        }
      },

      prevGroup: () => {
        const { currentGroupIndex } = get();
        if (currentGroupIndex > 0) {
          set({ currentGroupIndex: currentGroupIndex - 1 });
        }
      },

      setTotalGroups: (count) => {
        const { currentGroupIndex } = get();
        set({ 
          totalGroups: count,
          currentGroupIndex: count > 0 ? Math.min(currentGroupIndex, count - 1) : 0,
        });
      },

      resetNavigation: () => {
        set({ currentGroupIndex: 0, totalGroups: 0 });
      },

      touch: () => set({ updatedAtMs: Date.now() }),

      setDraft: (exerciseId, patch) =>
        set((s) => ({
          draftByExerciseId: {
            ...s.draftByExerciseId,
            [exerciseId]: {
              ...s.draftByExerciseId[exerciseId],
              ...patch,
              touchedAtMs: Date.now(),
            },
          },
          updatedAtMs: Date.now(),
        })),

      clearDraft: () => set({ draftByExerciseId: {}, updatedAtMs: Date.now() }),
    }),
    {
      name: 'clientActiveSession',
      // Persist essential state including drafts
      partialize: (state) => ({
        activeSessionId: state.activeSessionId,
        startedAtMs: state.startedAtMs,
        pausedAtMs: state.pausedAtMs,
        accumulatedPauseMs: state.accumulatedPauseMs,
        isPaused: state.isPaused,
        restTimerEndMs: state.restTimerEndMs,
        restTimerGroupId: state.restTimerGroupId,
        currentGroupIndex: state.currentGroupIndex,
        totalGroups: state.totalGroups,
        draftByExerciseId: state.draftByExerciseId,
        updatedAtMs: state.updatedAtMs,
        persistVersion: state.persistVersion,
      }),
    }
  )
);
