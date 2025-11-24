import { create } from "zustand";
import type { TrainingSessionWithClient } from "@/features/sessions/types";
import type { EventWithClient } from "@/features/events/types";
import { getActiveSession } from "@/features/sessions/api/sessions.api";
import { getUpcomingCoachEvent } from "@/features/events/api/events.api";

interface SessionStore {
  activeSession: TrainingSessionWithClient | null;
  upcomingEvent: EventWithClient | null;
  isLoading: boolean;
  fetchActiveSession: () => Promise<void>;
  fetchUpcomingEvent: () => Promise<void>;
  clearActiveSession: () => void;
  setActiveSession: (session: TrainingSessionWithClient | null) => void;
  startPolling: () => void;
  stopPolling: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

export const useSessionStore = create<SessionStore>((set, get) => ({
  activeSession: null,
  upcomingEvent: null,
  isLoading: false,

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
    set({ activeSession: null });
  },

  setActiveSession: (session) => {
    set({ activeSession: session });
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
