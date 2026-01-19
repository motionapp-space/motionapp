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

interface ClientSessionState {
  // Session identity
  activeSessionId: string | null;
  
  // Timing (all in milliseconds)
  startedAtMs: number | null;
  pausedAtMs: number | null;
  accumulatedPauseMs: number;
  
  // State flags
  isPaused: boolean;
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
}

const initialState: ClientSessionState = {
  activeSessionId: null,
  startedAtMs: null,
  pausedAtMs: null,
  accumulatedPauseMs: 0,
  isPaused: false,
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
    }),
    {
      name: 'clientActiveSession',
      // Only persist essential state
      partialize: (state) => ({
        activeSessionId: state.activeSessionId,
        startedAtMs: state.startedAtMs,
        pausedAtMs: state.pausedAtMs,
        accumulatedPauseMs: state.accumulatedPauseMs,
        isPaused: state.isPaused,
      }),
    }
  )
);
