import { useMemo } from "react";
import { parseISO, format, isSameDay } from "date-fns";
import { minutesFromDayStart, toMinutes, MINUTE_HEIGHT } from "@/features/events/utils/time";
import type { AvailableSlot } from "../types";

interface AvailableSlotsOverlayProps {
  date: Date;
  slots: AvailableSlot[];
  onSlotClick?: (slot: AvailableSlot) => void;
}

/**
 * Displays available booking slots as clickable green overlays in the calendar
 */
export function AvailableSlotsOverlay({
  date,
  slots,
  onSlotClick,
}: AvailableSlotsOverlayProps) {
  const daySlots = useMemo(() => {
    return slots.filter((slot) => {
      const slotDate = parseISO(slot.start);
      return isSameDay(slotDate, date);
    });
  }, [slots, date]);

  if (daySlots.length === 0) return null;

  return (
    <>
      {daySlots.map((slot, index) => {
        const start = parseISO(slot.start);
        const end = parseISO(slot.end);

        const top = minutesFromDayStart(start) * MINUTE_HEIGHT;
        const height = (toMinutes(end) - toMinutes(start)) * MINUTE_HEIGHT;

        return (
          <div
            key={`${slot.start}-${index}`}
            className="absolute left-0 right-0 bg-green-500/10 border border-green-500/30 rounded cursor-pointer hover:bg-green-500/20 transition-colors group"
            style={{ top, height: Math.max(24, height) }}
            onClick={() => onSlotClick?.(slot)}
            role="button"
            tabIndex={0}
            aria-label={`Slot disponibile ${format(start, "HH:mm")} - ${format(end, "HH:mm")}`}
          >
            <div className="px-2 py-1 text-xs text-green-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              {format(start, "HH:mm")} - {format(end, "HH:mm")}
            </div>
          </div>
        );
      })}
    </>
  );
}
