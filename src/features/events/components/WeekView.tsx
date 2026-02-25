import { useMemo, useEffect, useRef, useState } from "react";
import { format, isSameDay, startOfDay, endOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { getWeekDays } from "../utils/calendar-utils";
import { layoutOverlaps } from "../utils/layout";
import { minutesFromDayStart, toMinutes, MINUTE_HEIGHT, DAY_START_H, DAY_END_H, minutesVisible, hoursArray } from "../utils/time";
import { EventCard } from "./EventCard";
import { BookingRequestCard } from "@/features/bookings/components/BookingRequestCard";
import { OutOfOfficeOverlay } from "@/features/bookings/components/OutOfOfficeOverlay";
import { AvailabilityOverlay } from "@/features/bookings/components/AvailabilityOverlay";
import { cn } from "@/lib/utils";
import type { EventWithClient } from "../types";
import type { BookingRequestWithClient, AvailabilityWindow, OutOfOfficeBlock } from "@/features/bookings/types";

const HOUR_LABEL_OFFSET = -4; // Offset verticale per etichette orarie

interface WeekViewProps {
  date: Date;
  events: EventWithClient[];
  bookingRequests?: BookingRequestWithClient[];
  availabilityWindows?: AvailabilityWindow[];
  oooBlocks?: OutOfOfficeBlock[];
  onEventClick: (event: EventWithClient) => void;
  onRequestClick?: (request: BookingRequestWithClient) => void;
  mode?: 'coach' | 'client';
  onGridClick?: (date: Date, startTime: Date) => void;
  isPreviewMode?: boolean;
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
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();

  // Memoize event positioning per day
  const positionedByDay = useMemo(() => {
    const dayMap: Record<number, ReturnType<typeof layoutOverlaps>> = {};
    
    weekDays.forEach((day, index) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const dayEvents = events.filter((e) => {
        const eventStart = new Date(e.start_at);
        const eventEnd = new Date(e.end_at);
        if (e.is_all_day) {
          return isSameDay(eventStart, day);
        }
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

  // Auto-scroll to position current time at 30% from top - only on initial load
  useEffect(() => {
    if (hasUserScrolled) return;
    
    const el = scrollContainerRef.current;
    if (!el) return;
    
    const mNowTotal = currentHour * 60 + currentMinutes;
    const mFromStart = mNowTotal - DAY_START_H * 60;
    const targetPosition = mFromStart * MINUTE_HEIGHT;
    // Position current time at 30% from top of viewport
    const scrollOffset = targetPosition - (el.clientHeight * 0.30);
    el.scrollTo({ top: Math.max(0, scrollOffset), behavior: 'auto' });
  }, [hasUserScrolled]);

  // Track user scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    const handleScroll = () => {
      setHasUserScrolled(true);
    };
    
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const gridHeight = minutesVisible() * MINUTE_HEIGHT;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day Headers - IN FLOW (not absolute), h-10 (40px), z-30 for stacking */}
      <div className="h-10 bg-card flex shrink-0 shadow-sm">
        {/* Spacer for hour column */}
        <div className="w-14 shrink-0 border-r border-border/40" />
        
        {/* Day headers */}
        {dailyCounts.map(({ day, count }) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 border-r last:border-r-0 border-border/30",
                isToday
                  ? "bg-accent border-accent"
                  : ""
              )}
            >
              <span className={cn(
                "text-xs uppercase",
                isToday ? "text-white/90" : "text-muted-foreground"
              )}>
                {format(day, "EEE", { locale: it })}
              </span>
              <span className={cn(
                "text-sm font-semibold",
                isToday ? "text-white font-bold" : ""
              )}>
                {format(day, "d")}
              </span>
              {count > 0 && (
                <span className={cn(
                  "text-[10px] font-medium",
                  isToday ? "text-white/70" : "text-muted-foreground"
                )}>
                  ({count})
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable Grid - flex-1 takes all remaining space, ONLY scrollable element */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div className="flex pt-2">
        {/* Hour column */}
        <div className="w-14 shrink-0 border-r border-border/40 text-[11px] text-muted-foreground">
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((hour, i) => (
              <div 
                key={hour} 
                className="absolute w-full flex items-center justify-end pr-2" 
                style={{ top: i * 60 * MINUTE_HEIGHT + HOUR_LABEL_OFFSET }}
              >
                {format(new Date().setHours(hour, 0), "HH:mm")}
              </div>
            ))}
          </div>
        </div>

        {/* Time grid columns */}
        <div className="flex-1 flex relative" style={{ height: gridHeight }}>
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
                className={cn(
                  "flex-1 relative border-r last:border-r-0 border-border/40",
                  isDayToday && "bg-accent/[0.04]",
                  isPreviewMode ? 'cursor-default' : 'cursor-pointer'
                )}
                onClick={(e) => {
                  if (isPreviewMode) {
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
                    className="absolute left-0 right-0 border-t border-border/50" 
                    style={{ top: i * 60 * MINUTE_HEIGHT }} 
                  />
                ))}

                {/* Overlays */}
                <AvailabilityOverlay date={day} windows={availabilityWindows} interactive={mode === 'coach'} />
                <OutOfOfficeOverlay date={day} blocks={oooBlocks} />

                {/* Current time line - more prominent */}
                {isDayToday && (
                  <div 
                    className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    style={{ top: minutesFromDayStart(new Date()) * MINUTE_HEIGHT }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-accent -ml-1" />
                    <div className="flex-1 h-[2px] bg-accent" />
                  </div>
                )}

                {/* Event cards */}
                {positioned.map((p) => {
                  const ev = events.find((e) => e.id === p.id)!;
                  if (!ev) return null;
                  
                  const start = new Date(ev.start_at);
                  const end = new Date(ev.end_at);
                  
                  const visibleStart = new Date(dayStart);
                  visibleStart.setHours(DAY_START_H, 0, 0, 0);
                  const visibleEnd = new Date(dayStart);
                  visibleEnd.setHours(DAY_END_H, 59, 59, 999);
                  
                  const startClamped = start < visibleStart ? visibleStart : (start > dayEnd ? dayEnd : start);
                  const endClamped = end > visibleEnd ? visibleEnd : (end < dayStart ? dayStart : end);
                  
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
                  
                  const visibleStart = new Date(dayStart);
                  visibleStart.setHours(DAY_START_H, 0, 0, 0);
                  const visibleEnd = new Date(dayStart);
                  visibleEnd.setHours(DAY_END_H, 59, 59, 999);
                  
                  const startClamped = start < visibleStart ? visibleStart : (start > dayEnd ? dayEnd : start);
                  const endClamped = end > visibleEnd ? visibleEnd : (end < dayStart ? dayStart : end);
                  
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