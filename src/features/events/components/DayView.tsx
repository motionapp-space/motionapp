import { useMemo, useEffect, useRef, useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { layoutOverlaps } from "../utils/layout";
import { minutesFromDayStart, toMinutes, MINUTE_HEIGHT, DAY_START_H, DAY_END_H, minutesVisible, hoursArray } from "../utils/time";
import { EventCard } from "./EventCard";
import { BookingRequestCard } from "@/features/bookings/components/BookingRequestCard";
import { OutOfOfficeOverlay } from "@/features/bookings/components/OutOfOfficeOverlay";
import { AvailabilityOverlay } from "@/features/bookings/components/AvailabilityOverlay";
import type { EventWithClient } from "../types";
import type { BookingRequestWithClient, AvailabilityWindow, OutOfOfficeBlock } from "@/features/bookings/types";

interface DayViewProps {
  date: Date;
  events: EventWithClient[];
  bookingRequests?: BookingRequestWithClient[];
  availabilityWindows?: AvailabilityWindow[];
  oooBlocks?: OutOfOfficeBlock[];
  onEventClick: (event: EventWithClient) => void;
  onRequestClick?: (request: BookingRequestWithClient) => void;
}

export function DayView({
  date,
  events,
  bookingRequests = [],
  availabilityWindows = [],
  oooBlocks = [],
  onEventClick,
  onRequestClick,
}: DayViewProps) {
  const hours = useMemo(() => hoursArray(), []);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();
  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  // Measure header height for grid offset
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeaderHeight(el.offsetHeight));
    ro.observe(el);
    setHeaderHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // Position events with overlap layout
  const positioned = useMemo(() => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const dayEvents = events.filter((e) => {
      const eventStart = new Date(e.start_at);
      const eventEnd = new Date(e.end_at);
      return eventStart < dayEnd && eventEnd > dayStart;
    });
    
    return layoutOverlaps(
      dayEvents.map((e) => ({
        id: e.id,
        start_at: e.start_at,
        end_at: e.end_at,
        client_id: e.client_id,
      }))
    );
  }, [events, date]);

  // Position booking requests with overlap layout
  const positionedRequests = useMemo(() => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const dayRequests = bookingRequests.filter((r) => {
      const reqStart = new Date(r.requested_start_at);
      const reqEnd = new Date(r.requested_end_at);
      return reqStart < dayEnd && reqEnd > dayStart;
    });
    
    return layoutOverlaps(
      dayRequests.map((r) => ({
        id: r.id,
        start_at: r.requested_start_at,
        end_at: r.requested_end_at,
        client_id: r.client_id,
      }))
    );
  }, [bookingRequests, date]);

  const gridHeight = minutesVisible() * MINUTE_HEIGHT;

  return (
    <div className="flex h-full overflow-auto">
      <div className="min-w-[600px] flex flex-col">
        {/* Header spacer */}
        <div ref={headerRef} className="h-14 border-b border-border/50" />
        
        <div className="flex">
          {/* Hour labels */}
          <div className="w-20 flex-shrink-0 border-r border-border/50 text-xs text-muted-foreground">
            <div className="relative" style={{ height: gridHeight }}>
              {hours.map((hour, i) => (
                <div 
                  key={hour} 
                  className="absolute w-full flex items-center justify-end pr-3" 
                  style={{ top: i * 60 * MINUTE_HEIGHT }}
                >
                  {format(new Date().setHours(hour, 0), "HH:mm")}
                </div>
              ))}
            </div>
          </div>

          {/* Event grid */}
          <div className="flex-1 relative" style={{ height: gridHeight }}>
            {/* Hour lines */}
            {hours.map((_, i) => (
              <div 
                key={i} 
                className="absolute left-0 right-0 border-t border-border/40" 
                style={{ top: i * 60 * MINUTE_HEIGHT }} 
              />
            ))}

            {/* Overlays */}
            <AvailabilityOverlay date={date} windows={availabilityWindows} />
            <OutOfOfficeOverlay date={date} blocks={oooBlocks} />

            {/* Current time line */}
            {isToday && currentHour >= DAY_START_H && currentHour <= DAY_END_H && (
              <div 
                className="absolute left-0 right-0 h-0.5 bg-destructive z-10 pointer-events-none"
                style={{ top: minutesFromDayStart(new Date()) * MINUTE_HEIGHT }}
              >
                <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-destructive" />
              </div>
            )}

            {/* Events with positioning */}
            {positioned.map((p) => {
              const ev = events.find((e) => e.id === p.id)!;
              if (!ev) return null;
              
              const start = new Date(ev.start_at);
              const end = new Date(ev.end_at);
              
              const dayStart = new Date(date);
              dayStart.setHours(DAY_START_H, 0, 0, 0);
              const dayEnd = new Date(date);
              dayEnd.setHours(DAY_END_H, 0, 0, 0);
              
              const startClamped = start < dayStart ? dayStart : start;
              const endClamped = end > dayEnd ? dayEnd : end;

              const top = minutesFromDayStart(startClamped) * MINUTE_HEIGHT;
              const height = (toMinutes(endClamped) - toMinutes(startClamped)) * MINUTE_HEIGHT;
              const widthPercent = 1 / p.columns;
              const leftPercent = p.column * widthPercent;

              return (
                <EventCard
                  key={p.id}
                  event={ev}
                  onClick={() => onEventClick(ev)}
                  positioning={{ top, height, leftPercent, widthPercent }}
                />
              );
            })}

            {/* Booking Requests */}
            {positionedRequests.map((p) => {
              const req = bookingRequests.find((r) => r.id === p.id)!;
              if (!req) return null;
              
              const start = new Date(req.requested_start_at);
              const end = new Date(req.requested_end_at);
              
              const dayStart = new Date(date);
              dayStart.setHours(DAY_START_H, 0, 0, 0);
              const dayEnd = new Date(date);
              dayEnd.setHours(DAY_END_H, 0, 0, 0);
              
              const startClamped = start < dayStart ? dayStart : start;
              const endClamped = end > dayEnd ? dayEnd : end;

              const top = minutesFromDayStart(startClamped) * MINUTE_HEIGHT;
              const height = (toMinutes(endClamped) - toMinutes(startClamped)) * MINUTE_HEIGHT;
              const widthPercent = 1 / p.columns;
              const leftPercent = p.column * widthPercent;

              return (
                <BookingRequestCard
                  key={p.id}
                  request={req}
                  onClick={() => onRequestClick?.(req)}
                  positioning={{ top, height, leftPercent, widthPercent }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
