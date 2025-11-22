import { useMemo, useEffect, useRef, useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
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
  mode?: 'coach' | 'client'; // FASE 3
  onGridClick?: (date: Date, startTime: Date) => void; // FASE 3
  isPreviewMode?: boolean; // FASE 4: Disabilita interazioni in preview
}

export function DayView({
  date,
  events,
  bookingRequests = [],
  availabilityWindows = [],
  oooBlocks = [],
  onEventClick,
  onRequestClick,
  mode = 'coach',
  onGridClick,
  isPreviewMode = false,
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
  // FASE 6: Memoize event positioning
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
          <div 
            className={`flex-1 relative ${isPreviewMode ? 'cursor-default' : ''}`}
            style={{ height: gridHeight }}
            onClick={(e) => {
              if (isPreviewMode) {
                // PATCH 2: Toast solo su click grid vuota (non su eventi)
                if (e.target === e.currentTarget) {
                  toast.error("Non puoi creare appuntamenti in modalità simulazione", {
                    description: "Torna alla vista coach per creare eventi."
                  });
                }
                return;
              }
              
              if (mode === 'coach' && onGridClick && e.target === e.currentTarget) {
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const minutesFromStart = Math.floor(y / MINUTE_HEIGHT);
                const hours = DAY_START_H + Math.floor(minutesFromStart / 60);
                const minutes = Math.floor((minutesFromStart % 60) / 15) * 15;
                
                const clickTime = new Date(date);
                clickTime.setHours(hours, minutes, 0, 0);
                
                onGridClick(date, clickTime);
              }
            }}
          >
            {/* Hour lines */}
            {hours.map((_, i) => (
              <div 
                key={i} 
                className="absolute left-0 right-0 border-t border-border/40" 
                style={{ top: i * 60 * MINUTE_HEIGHT }} 
              />
            ))}

            {/* Overlays */}
            <AvailabilityOverlay date={date} windows={availabilityWindows} interactive={mode === 'coach'} />
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
              
              // Define visible interval (05:00 - 23:00)
              const visibleStart = new Date(date);
              visibleStart.setHours(DAY_START_H, 0, 0, 0);
              
              const visibleEnd = new Date(date);
              visibleEnd.setHours(DAY_END_H, 59, 59, 999);
              
              const dayStart = startOfDay(date);
              const dayEnd = endOfDay(date);
              
              // Clamp to visible interval
              const startClamped = start < visibleStart ? visibleStart : (start > dayEnd ? dayEnd : start);
              const endClamped = end > visibleEnd ? visibleEnd : (end < dayStart ? dayStart : end);
              
              // Hide if completely outside visible interval
              if (endClamped <= visibleStart || startClamped >= visibleEnd) return null;

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
              
              // Define visible interval (05:00 - 23:00)
              const visibleStart = new Date(date);
              visibleStart.setHours(DAY_START_H, 0, 0, 0);
              
              const visibleEnd = new Date(date);
              visibleEnd.setHours(DAY_END_H, 59, 59, 999);
              
              const dayStart = startOfDay(date);
              const dayEnd = endOfDay(date);
              
              // Clamp to visible interval
              const startClamped = start < visibleStart ? visibleStart : (start > dayEnd ? dayEnd : start);
              const endClamped = end > visibleEnd ? visibleEnd : (end < dayStart ? dayStart : end);
              
              // Hide if completely outside visible interval
              if (endClamped <= visibleStart || startClamped >= visibleEnd) return null;

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
