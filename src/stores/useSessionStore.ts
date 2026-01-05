import { create } from "zustand";
import type { TrainingSessionWithClient } from "@/features/sessions/types";

interface SessionStore {
  activeSession: TrainingSessionWithClient | null;
  isPaused: boolean;
  pausedAt: number | null;
  accumulatedPauseTime: number;
  clearActiveSession: () => void;
  setActiveSession: (session: TrainingSessionWithClient | null) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  getElapsedSeconds: () => number;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  activeSession: null,
  isPaused: false,
  pausedAt: null,
  accumulatedPauseTime: 0,

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
}));
