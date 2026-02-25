import { useMemo } from "react";
import { getDay } from "date-fns";
import { MINUTE_HEIGHT, DAY_START_H } from "@/features/events/utils/time";
import type { AvailabilityWindow } from "../types";

interface AvailabilityOverlayProps {
  date: Date;
  windows: AvailabilityWindow[];
  interactive?: boolean; // FASE 3: Se true, l'overlay è solo visivo
}

export function AvailabilityOverlay({ date, windows, interactive = false }: AvailabilityOverlayProps) {
  const dayOfWeek = useMemo(() => {
    return (getDay(date) + 6) % 7; // Convert Sunday=0 to Monday=0
  }, [date]);

  const overlayWindows = useMemo(() => {
    return windows
      .filter((w) => w.day_of_week === dayOfWeek)
      .map((window) => {
        const [startHour, startMinute] = window.start_time.split(":").map(Number);
        const [endHour, endMinute] = window.end_time.split(":").map(Number);

        const startMinutesFromDayStart = (startHour - DAY_START_H) * 60 + startMinute;
        const endMinutesFromDayStart = (endHour - DAY_START_H) * 60 + endMinute;

        const top = Math.max(0, startMinutesFromDayStart * MINUTE_HEIGHT);
        const height =
          (endMinutesFromDayStart - Math.max(startMinutesFromDayStart, 0)) *
          MINUTE_HEIGHT;

        return {
          id: window.id,
          top,
          height,
        };
      });
  }, [windows, dayOfWeek]);

  if (overlayWindows.length === 0) return null;

  return (
    <>
      {overlayWindows.map((window) => (
        <div
          key={window.id}
          className={`absolute inset-x-0 border-l-2 border-accent/30 ${
            interactive ? 'bg-accent/[0.06] pointer-events-none' : 'bg-accent/[0.06] pointer-events-none'
          }`}
          style={{
            top: window.top,
            height: window.height,
          }}
        />
      ))}
    </>
  );
}
