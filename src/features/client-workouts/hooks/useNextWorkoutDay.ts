import { useMemo } from "react";
import { isThisWeek } from "date-fns";
import type { ClientActivePlan } from "../api/client-plans.api";
import type { ClientSession } from "../api/client-sessions.api";
import type { Day } from "@/types/plan";
import { countDayExercises } from "../utils/plan-utils";

interface NextWorkoutDayResult {
  day: Day | null;
  exerciseCount: number;
  allCompleted: boolean;
}

/**
 * Hook to calculate the next uncompleted workout day for the current week.
 * Returns the first day in the plan that hasn't been completed this week.
 */
export function useNextWorkoutDay(
  plan: ClientActivePlan | null | undefined,
  sessions: ClientSession[] | undefined
): NextWorkoutDayResult {
  return useMemo(() => {
    if (!plan?.data?.days || plan.data.days.length === 0) {
      return { day: null, exerciseCount: 0, allCompleted: false };
    }

    const days = plan.data.days;

    // Get day IDs completed this week
    const completedDayIdsThisWeek = new Set(
      (sessions || [])
        .filter((s) => s.day_id && s.started_at && isThisWeek(new Date(s.started_at)))
        .map((s) => s.day_id!)
    );

    // Find first uncompleted day
    const nextDay = days.find((d) => !completedDayIdsThisWeek.has(d.id));

    if (!nextDay) {
      // All days completed this week
      return { day: null, exerciseCount: 0, allCompleted: true };
    }

    return {
      day: nextDay,
      exerciseCount: countDayExercises(nextDay),
      allCompleted: false,
    };
  }, [plan, sessions]);
}
