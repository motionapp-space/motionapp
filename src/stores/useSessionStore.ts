import { create } from "zustand";
import type { TrainingSessionWithClient } from "@/features/sessions/types";
import type { EventWithClient } from "@/features/events/types";
import { getActiveSession } from "@/features/sessions/api/sessions.api";
import { getUpcomingCoachEvent } from "@/features/events/api/events.api";

interface SessionStore {
  activeSession: TrainingSessionWithClient | null;
  upcomingEvent: EventWithClient | null;
  isLoading: boolean;
  isPaused: boolean;
  pausedAt: number | null;
  accumulatedPauseTime: number;
  fetchActiveSession: () => Promise<void>;
  fetchUpcomingEvent: () => Promise<void>;
  clearActiveSession: () => void;
  setActiveSession: (session: TrainingSessionWithClient | null) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  getElapsedSeconds: () => number;
  startPolling: () => void;
  stopPolling: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

export const useSessionStore = create<SessionStore>((set, get) => ({
  activeSession: null,
  upcomingEvent: null,
  isLoading: false,
  isPaused: false,
  pausedAt: null,
  accumulatedPauseTime: 0,

  fetchActiveSession: async () => {
    try {
      set({ isLoading: true });
      const session = await getActiveSession();
      set({ activeSession: session });
    } catch (error) {
      console.error("Error fetching active session:", error);
      set({ activeSession: null });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUpcomingEvent: async () => {
    try {
      const event = await getUpcomingCoachEvent();
      set({ upcomingEvent: event });
    } catch (error) {
      console.error("Error fetching upcoming event:", error);
      set({ upcomingEvent: null });
    }
  },

  clearActiveSession: () => {
    set({ 
      activeSession: null,
      isPaused: false,
      pausedAt: null,
      accumulatedPauseTime: 0
    });
  },

  setActiveSession: (session) => {
    set({ activeSession: session });
  },

  pauseSession: () => {
    set({ 
      isPaused: true, 
      pausedAt: Date.now() 
    });
  },

  resumeSession: () => {
    const { pausedAt, accumulatedPauseTime } = get();
    if (pausedAt) {
      const pauseDuration = Date.now() - pausedAt;
      set({ 
        isPaused: false, 
        pausedAt: null,
        accumulatedPauseTime: accumulatedPauseTime + pauseDuration
      });
    }
  },

  getElapsedSeconds: () => {
    const { activeSession, isPaused, pausedAt, accumulatedPauseTime } = get();
    if (!activeSession?.started_at) return 0;
    
    const started = new Date(activeSession.started_at).getTime();
    const now = isPaused && pausedAt ? pausedAt : Date.now();
    const totalElapsed = now - started - accumulatedPauseTime;
    
    return Math.max(0, Math.floor(totalElapsed / 1000));
  },

  startPolling: () => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Poll every 30 seconds
    pollingInterval = setInterval(() => {
      get().fetchActiveSession();
      get().fetchUpcomingEvent();
    }, 30000);
  },

  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  },
}));
