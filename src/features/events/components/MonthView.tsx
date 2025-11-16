import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { format, isSameMonth, isSameDay } from "date-fns";
import { getMonthDays, getEventsForDay } from "../utils/calendar-utils";
import { CalendarMonthCell } from "./CalendarMonthCell";
import { cn } from "@/lib/utils";
import type { EventWithClient } from "../types";

interface MonthViewProps {
  date: Date;
  events: EventWithClient[];
  onEventClick: (event: EventWithClient) => void;
}

export function MonthView({ date, events, onEventClick }: MonthViewProps) {
  const monthDays = useMemo(() => getMonthDays(date), [date]);
  const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellHeight, setCellHeight] = useState(120);

  // Calculate cell height from grid
  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rows = 6;
      const gap = 0;
      const h = Math.max(90, (el.clientHeight - gap * (rows - 1)) / rows);
      setCellHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day} className="text-center py-3 font-medium text-sm text-muted-foreground border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div ref={gridRef} className="flex-1 grid grid-cols-7 auto-rows-fr overflow-auto">
        {monthDays.map((day) => {
          const dayEvents = getEventsForDay(events, day);
          const isCurrentMonth = isSameMonth(day, date);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={format(day, 'yyyy-MM-dd')}
              className={cn(
                "min-h-[100px] border-r border-b last:border-r-0",
                !isCurrentMonth && "bg-muted/30",
                isToday && "bg-accent/10"
              )}
            >
              <CalendarMonthCell
                date={day}
                events={dayEvents}
                onOpenEvent={onEventClick}
                cellHeight={cellHeight}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
