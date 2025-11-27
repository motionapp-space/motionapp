import { useMemo } from "react";
import { format, startOfYear, addMonths, isSameMonth } from "date-fns";
import { it } from "date-fns/locale";
import { getMonthDays, getEventsForDay } from "../utils/calendar-utils";
import { cn } from "@/lib/utils";
import type { EventWithClient } from "../types";

interface YearViewProps {
  date: Date;
  events: EventWithClient[];
  onMonthClick: (month: Date) => void;
}

export function YearView({ date, events, onMonthClick }: YearViewProps) {
  const months = useMemo(() => {
    const start = startOfYear(date);
    return Array.from({ length: 12 }, (_, i) => addMonths(start, i));
  }, [date]);

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((month) => {
          const monthDays = getMonthDays(month);
          const monthEvents = events.filter((event) =>
            isSameMonth(new Date(event.start_at), month)
          );

          return (
            <div
              key={month.toISOString()}
              onClick={() => onMonthClick(month)}
              className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow flex flex-col"
            >
              <h3 className="text-lg text-center font-semibold mb-3 capitalize">
                {format(month, "MMMM", { locale: it })}
              </h3>

              {/* Mini calendar */}
              <div className="grid grid-cols-7 gap-1">
                {["L", "M", "M", "G", "V", "S", "D"].map((day, i) => (
                  <div
                    key={i}
                    className="text-xs text-center text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
                {monthDays.map((day) => {
                  const dayEvents = getEventsForDay(events, day);
                  const isCurrentMonth = isSameMonth(day, month);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "aspect-square flex items-center justify-center text-xs rounded",
                        !isCurrentMonth && "text-muted-foreground/40",
                        hasEvents && isCurrentMonth && "bg-primary text-primary-foreground font-semibold"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto pt-3 text-center text-sm text-muted-foreground">
                {monthEvents.length} {monthEvents.length === 1 ? "evento" : "eventi"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
