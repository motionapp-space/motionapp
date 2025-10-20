import React, { useMemo } from "react";
import { ClientColorDot } from "@/components/calendar/ClientColorDot";
import { cn } from "@/lib/utils";
import type { EventWithClient } from "../types";

type Props = {
  date: Date;
  events: EventWithClient[];
  onOpenEvent?: (event: EventWithClient) => void;
  cellHeight: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export function CalendarMonthCell({ 
  date, 
  events, 
  onOpenEvent, 
  cellHeight,
  isCurrentMonth,
  isToday 
}: Props) {
  const paddingTop = 24;
  const gap = 4;
  const minRowHeight = 18;
  const maxRowHeight = 28;
  
  const { rowHeight, visibleCount, overflowCount } = useMemo(() => {
    const availableHeight = cellHeight - paddingTop;
    const maxRowsPossible = Math.floor(availableHeight / (minRowHeight + gap));
    
    if (events.length === 0) {
      return { rowHeight: maxRowHeight, visibleCount: 0, overflowCount: 0 };
    }
    
    // Calculate optimal row height to fit all events
    const calculatedHeight = Math.max(
      minRowHeight,
      Math.min(
        (availableHeight - (events.length - 1) * gap) / events.length,
        maxRowHeight
      )
    );
    
    // Check if we need overflow
    const willOverflow = events.length > maxRowsPossible && calculatedHeight <= minRowHeight;
    const visible = willOverflow ? Math.max(0, maxRowsPossible - 1) : events.length;
    const overflow = Math.max(0, events.length - visible);
    
    return {
      rowHeight: calculatedHeight,
      visibleCount: visible,
      overflowCount: overflow
    };
  }, [events.length, cellHeight, paddingTop, gap, minRowHeight, maxRowHeight]);

  const visibleEvents = useMemo(() => events.slice(0, visibleCount), [events, visibleCount]);

  return (
    <div className="relative h-full w-full px-2 py-1">
      <div className={cn(
        "text-xs font-medium mb-1",
        !isCurrentMonth && "text-muted-foreground",
        isToday && "text-primary font-semibold"
      )}>
        {date.getDate()}
      </div>

      <div className="space-y-1">
        {visibleEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => onOpenEvent?.(event)}
            className="group flex w-full items-center gap-1.5 overflow-hidden rounded-md border border-border/60 bg-background px-1.5 hover:bg-muted/60 transition-colors"
            style={{ height: `${rowHeight}px` }}
            title={`${event.title} • ${event.client_name}`}
          >
            <ClientColorDot clientId={event.client_id} />
            <span className="truncate text-[11px] leading-none">
              {event.title}
              {rowHeight >= 24 && <span className="opacity-70"> · {event.client_name}</span>}
            </span>
          </button>
        ))}

        {overflowCount > 0 && (
          <button
            onClick={() => {
              // Could open a day view modal or expand the cell
              console.log("Show more events for", date);
            }}
            className="text-[11px] leading-none text-primary hover:underline"
            style={{ height: `${minRowHeight}px` }}
          >
            +{overflowCount} altri
          </button>
        )}
      </div>
    </div>
  );
}
