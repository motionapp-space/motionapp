import { useMemo } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { getEventsForTimeSlot } from "../utils/calendar-utils";
import { EventCard } from "./EventCard";
import type { EventWithClient } from "../types";

interface DayViewProps {
  date: Date;
  events: EventWithClient[];
  onEventClick: (event: EventWithClient) => void;
}

export function DayView({ date, events, onEventClick }: DayViewProps) {
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[600px]">
        {/* Time grid */}
        {hours.map((hour) => {
          const slotEvents = getEventsForTimeSlot(events, date, hour);
          return (
            <div key={hour} className="flex border-b">
              <div className="w-20 flex-shrink-0 text-right pr-4 py-2 text-sm text-muted-foreground border-r">
                {format(new Date().setHours(hour, 0), "HH:mm")}
              </div>
              <div className="flex-1 min-h-[60px] p-2 space-y-1">
                {slotEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick(event)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
