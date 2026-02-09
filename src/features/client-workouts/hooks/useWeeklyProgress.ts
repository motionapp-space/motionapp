import { useMemo } from "react";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import type { ClientActivePlan } from "../api/client-plans.api";
import type { ClientSession } from "../api/client-sessions.api";

export type WeekDayKey = 'L' | 'M' | 'M2' | 'G' | 'V' | 'S' | 'D';

export interface WeekDay {
  key: WeekDayKey;
  label: string;
  isPlanned: boolean;
  isCompleted: boolean;
  dayId?: string;
}

export interface WeeklyProgress {
  completedCount: number;
  totalDays: number;
  remainingCount: number;
  percentage: number;
  isWeekCompleted: boolean;
  weekDays: WeekDay[];
  completedDayIds: Set<string>;
  isLoading: boolean;
}

const WEEK_DAY_LABELS: { key: WeekDayKey; label: string }[] = [
  { key: 'L', label: 'L' },
  { key: 'M', label: 'M' },
  { key: 'M2', label: 'M' },
  { key: 'G', label: 'G' },
  { key: 'V', label: 'V' },
  { key: 'S', label: 'S' },
  { key: 'D', label: 'D' },
];

/**
 * Hook to calculate weekly workout progress
 * Returns progress stats and day-by-day breakdown for the current week
 */
export function useWeeklyProgress(
  plan: ClientActivePlan | null | undefined,
  sessions: ClientSession[] | undefined,
  isLoading: boolean = false
): WeeklyProgress {
  return useMemo(() => {
    // Default empty state
    const emptyWeekDays: WeekDay[] = WEEK_DAY_LABELS.map(({ key, label }) => ({
      key,
      label,
      isPlanned: false,
      isCompleted: false,
    }));

    if (isLoading) {
      return {
        completedCount: 0,
        totalDays: 0,
        remainingCount: 0,
        percentage: 0,
        isWeekCompleted: false,
        weekDays: emptyWeekDays,
        completedDayIds: new Set<string>(),
        isLoading: true,
      };
    }

    // No plan = no progress
    if (!plan?.data?.days || plan.data.days.length === 0) {
      return {
        completedCount: 0,
        totalDays: 0,
        remainingCount: 0,
        percentage: 0,
        isWeekCompleted: false,
        weekDays: emptyWeekDays,
        completedDayIds: new Set<string>(),
        isLoading: false,
      };
    }

    const planDays = plan.data.days;
    const totalDays = planDays.length;

    // Calculate current week boundaries (Monday to Sunday)
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Find completed day IDs this week (for reference)
    const completedDayIds = new Set<string>(
      (sessions || [])
        .filter((s) => {
          if (!s.day_id || !s.started_at) return false;
          const sessionDate = new Date(s.started_at);
          return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
        })
        .map((s) => s.day_id!)
    );

    // Count total sessions completed this week (not unique days)
    const thisWeekSessions = (sessions || []).filter((s) => {
      if (!s.started_at) return false;
      const sessionDate = new Date(s.started_at);
      return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
    });

    const completedCount = thisWeekSessions.length;

    // Set of weekday indices for visual day indicators only
    const completedWeekDayIndices = new Set<number>(
      thisWeekSessions.map((s) => {
        const sessionDate = new Date(s.started_at!);
        const jsDay = sessionDate.getDay();
        return jsDay === 0 ? 6 : jsDay - 1;
      })
    );
    const remainingCount = Math.max(0, totalDays - completedCount);
    const percentage = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
    const isWeekCompleted = completedCount >= totalDays;

    // Build weekDays array
    // isPlanned: first N days where N = number of days in the plan (indicates target frequency)
    // isCompleted: based on actual calendar day the session was completed
    const weekDays: WeekDay[] = WEEK_DAY_LABELS.map(({ key, label }, index) => {
      const isPlanned = index < planDays.length;
      const isCompleted = completedWeekDayIndices.has(index);
      
      return {
        key,
        label,
        isPlanned,
        isCompleted,
        dayId: planDays[index]?.id,
      };
    });

    return {
      completedCount,
      totalDays,
      remainingCount,
      percentage,
      isWeekCompleted,
      weekDays,
      completedDayIds,
      isLoading: false,
    };
  }, [plan, sessions, isLoading]);
}
