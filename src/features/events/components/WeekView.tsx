import { useMemo, useEffect, useRef, useState } from "react";
import { format, isSameDay, startOfDay, endOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { getWeekDays, getEventsForDay } from "../utils/calendar-utils";
import { layoutOverlaps } from "../utils/layout";
import { minutesFromDayStart, toMinutes, MINUTE_HEIGHT, DAY_START_H, DAY_END_H, minutesVisible, hoursArray } from "../utils/time";
import { EventCard } from "./EventCard";
import { BookingRequestCard } from "@/features/bookings/components/BookingRequestCard";
import { OutOfOfficeOverlay } from "@/features/bookings/components/OutOfOfficeOverlay";
import { AvailabilityOverlay } from "@/features/bookings/components/AvailabilityOverlay";
import type { EventWithClient } from "../types";
import type { BookingRequestWithClient, AvailabilityWindow, OutOfOfficeBlock } from "@/features/bookings/types";

interface WeekViewProps {
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

export function WeekView({
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
}: WeekViewProps) {
  const weekDays = useMemo(() => getWeekDays(date), [date]);
  const hours = useMemo(() => hoursArray(), []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();

  // Measure header height for grid offset
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeaderHeight(el.offsetHeight));
    ro.observe(el);
    setHeaderHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);
  
  // FASE 6: Memoize event positioning per day
  const positionedByDay = useMemo(() => {
    const dayMap: Record<number, ReturnType<typeof layoutOverlaps>> = {};
    
    weekDays.forEach((day, index) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const dayEvents = events.filter((e) => {
        const eventStart = new Date(e.start_at);
        const eventEnd = new Date(e.end_at);
      
        // Se è all-day → lo mostri solo se corrisponde allo stesso giorno
        if (e.is_all_day) {
          return isSameDay(eventStart, day);
        }
      
        // Altrimenti mantieni la logica normale di overlapping
        return eventStart < dayEnd && eventEnd > dayStart;
      });
      
      dayMap[index] = layoutOverlaps(
        dayEvents.map((e) => ({
          id: e.id,
          start_at: e.start_at,
          end_at: e.end_at,
          client_id: e.coach_client_id,
        }))
      );
    });
    
    return dayMap;
  }, [events, weekDays]);

  // Position booking requests per day
  const positionedRequestsByDay = useMemo(() => {
    const dayMap: Record<number, ReturnType<typeof layoutOverlaps>> = {};
    
    weekDays.forEach((day, index) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayRequests = bookingRequests.filter((r) => {
        const reqStart = new Date(r.requested_start_at);
        const reqEnd = new Date(r.requested_end_at);
        return reqStart < dayEnd && reqEnd > dayStart;
      });
      
      dayMap[index] = layoutOverlaps(
        dayRequests.map((r) => ({
          id: r.id,
          start_at: r.requested_start_at,
          end_at: r.requested_end_at,
          client_id: r.coach_client_id,
        }))
      );
    });
    
    return dayMap;
  }, [bookingRequests, weekDays]);

  const dailyCounts = useMemo(() => {
    return weekDays.map((day, index) => ({
      day,
      count: (positionedByDay[index] || []).length
    }));
  }, [weekDays, positionedByDay]);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    if (currentHour >= DAY_START_H && currentHour <= DAY_END_H) {
      const mNowTotal = currentHour * 60 + currentMinutes;
      const mFromStart = mNowTotal - DAY_START_H * 60;
      const y = Math.max(0, mFromStart * MINUTE_HEIGHT - el.clientHeight / 2);
      el.scrollTo({ top: y, behavior: 'auto' });
    }
  }, [currentHour, currentMinutes]);

  const gridHeight = minutesVisible() * MINUTE_HEIGHT;

  return (
    <div className="flex h-full">
      {/* Scrollable container for both hour column and grid */}
      <div ref={scrollContainerRef} className="flex flex-1 overflow-y-auto">
        {/* Left hour column 05:00–23:00 */}
        <div className="w-20 flex-shrink-0 border-r border-border/50 text-xs text-muted-foreground">
          <div className="relative" style={{ height: gridHeight + headerHeight }}>
            {hours.map((hour, i) => (
              <div 
                key={hour} 
                className="absolute w-full flex items-center justify-end pr-3" 
                style={{ top: headerHeight + i * 60 * MINUTE_HEIGHT }}
              >
                {format(new Date().setHours(hour, 0), "HH:mm")}
              </div>
            ))}
          </div>
        </div>

        {/* Right grid */}
        <div className="flex-1">
          {/* Day headers with counts */}
          <div ref={headerRef} className="flex border-b sticky top-0 bg-card z-10">
            {dailyCounts.map(({ day, count }) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className="flex-1 text-center py-3 border-r last:border-r-0"
                >
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE", { locale: it })}
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-primary' : ''}`}>
                    {format(day, "d")}
                  </div>
                  {count > 0 && (
                    <div className="text-xs font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-1">
                      <span>{count}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="relative flex" style={{ height: gridHeight }}>
            {weekDays.map((day, dayIndex) => {
              const dayStart = new Date(day);
              dayStart.setHours(DAY_START_H, 0, 0, 0);
              const dayEnd = new Date(day);
              dayEnd.setHours(DAY_END_H, 0, 0, 0);
              
              const positioned = positionedByDay[dayIndex] || [];
              const isDayToday = isSameDay(day, new Date());

              return (
                <div 
                  key={day.toISOString()} 
                  className={`flex-1 relative border-r last:border-r-0 border-border/20 ${isPreviewMode ? 'cursor-default' : ''}`}
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
                      
                      const clickTime = new Date(day);
                      clickTime.setHours(hours, minutes, 0, 0);
                      
                      onGridClick(day, clickTime);
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
                  <AvailabilityOverlay date={day} windows={availabilityWindows} interactive={mode === 'coach'} />
                  <OutOfOfficeOverlay date={day} blocks={oooBlocks} />

                  {/* Current time line */}
                  {isDayToday && currentHour >= DAY_START_H && currentHour <= DAY_END_H && (
                    <div 
                      className="absolute left-0 right-0 h-0.5 bg-destructive z-10 pointer-events-none"
                      style={{ top: minutesFromDayStart(new Date()) * MINUTE_HEIGHT }}
                    >
                      <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-destructive" />
                    </div>
                  )}

                  {/* Event cards with positioning */}
                  {positioned.map((p) => {
                    const ev = events.find((e) => e.id === p.id)!;
                    if (!ev) return null;
                    
                    const start = new Date(ev.start_at);
                    const end = new Date(ev.end_at);
                    
                    // Define visible interval (05:00 - 23:00)
                    const visibleStart = new Date(dayStart);
                    visibleStart.setHours(DAY_START_H, 0, 0, 0);
                    
                    const visibleEnd = new Date(dayStart);
                    visibleEnd.setHours(DAY_END_H, 59, 59, 999);
                    
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
                        compact
                        positioning={{ top, height, leftPercent, widthPercent }}
                      />
                    );
                  })}

                  {/* Booking Requests */}
                  {(positionedRequestsByDay[dayIndex] || []).map((p) => {
                    const req = bookingRequests.find((r) => r.id === p.id);
                    if (!req) return null;
                    
                    const start = new Date(req.requested_start_at);
                    const end = new Date(req.requested_end_at);
                    
                    // Define visible interval (05:00 - 23:00)
                    const visibleStart = new Date(dayStart);
                    visibleStart.setHours(DAY_START_H, 0, 0, 0);
                    
                    const visibleEnd = new Date(dayStart);
                    visibleEnd.setHours(DAY_END_H, 59, 59, 999);
                    
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
