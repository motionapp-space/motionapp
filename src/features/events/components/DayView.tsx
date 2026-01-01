import { useMemo, useEffect, useRef, useState } from "react";
import { format, startOfDay, endOfDay, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { layoutOverlaps } from "../utils/layout";
import { minutesFromDayStart, toMinutes, MINUTE_HEIGHT, DAY_START_H, DAY_END_H, minutesVisible, hoursArray } from "../utils/time";
import { EventCard } from "./EventCard";
import { BookingRequestCard } from "@/features/bookings/components/BookingRequestCard";
import { OutOfOfficeOverlay } from "@/features/bookings/components/OutOfOfficeOverlay";
import { AvailabilityOverlay } from "@/features/bookings/components/AvailabilityOverlay";
import { cn } from "@/lib/utils";
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
  mode?: 'coach' | 'client';
  onGridClick?: (date: Date, startTime: Date) => void;
  isPreviewMode?: boolean;
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();
  const isToday = isSameDay(date, new Date());

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
        client_id: e.coach_client_id,
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
        client_id: r.coach_client_id,
      }))
    );
  }, [bookingRequests, date]);

  // Auto-scroll to position current time at 30% from top - only on initial load
  useEffect(() => {
    if (hasUserScrolled) return;
    
    const el = scrollContainerRef.current;
    if (!el) return;
    
    const mNowTotal = currentHour * 60 + currentMinutes;
    const mFromStart = mNowTotal - DAY_START_H * 60;
    const targetPosition = mFromStart * MINUTE_HEIGHT;
    // Position current time at 30% from top
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
      {/* Day Header - IN FLOW (not absolute), h-10 (40px) */}
      <div className="h-10 bg-white flex shrink-0 shadow-sm">
        {/* Spacer for hour column */}
        <div className="w-14 shrink-0 border-r border-border/50" />
        
        {/* Day header content */}
        <div className={cn(
          "flex-1 flex items-center justify-center gap-2",
          isToday && "bg-primary/5"
        )}>
          <span className="text-xs text-muted-foreground uppercase">
            {format(date, "EEEE", { locale: it })}
          </span>
          <span className={cn(
            "text-sm font-semibold",
            isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
          )}>
            {format(date, "d")}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(date, "MMMM yyyy", { locale: it })}
          </span>
        </div>
      </div>

      {/* Scrollable Grid - flex-1 takes all remaining space, ONLY scrollable element */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div className="flex pt-2">
        {/* Hour column */}
        <div className="w-14 shrink-0 border-r border-border/50 text-[11px] text-muted-foreground">
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((hour, i) => (
              <div 
                key={hour} 
                className="absolute w-full flex items-center justify-end pr-2" 
                style={{ top: i * 60 * MINUTE_HEIGHT - 6 }}
              >
                {format(new Date().setHours(hour, 0), "HH:mm")}
              </div>
            ))}
          </div>
        </div>

        {/* Event grid */}
        <div 
          className={cn(
            "flex-1 relative",
            isToday && "bg-primary/[0.02]",
            isPreviewMode ? 'cursor-default' : 'cursor-pointer'
          )}
          style={{ height: gridHeight }}
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
              className="absolute left-0 right-0 border-t border-border/30" 
              style={{ top: i * 60 * MINUTE_HEIGHT }} 
            />
          ))}

          {/* Overlays */}
          <AvailabilityOverlay date={date} windows={availabilityWindows} interactive={mode === 'coach'} />
          <OutOfOfficeOverlay date={date} blocks={oooBlocks} />

          {/* Current time line - more prominent */}
          {isToday && (
            <div 
              className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
              style={{ top: minutesFromDayStart(new Date()) * MINUTE_HEIGHT }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-primary -ml-1" />
              <div className="flex-1 h-[2px] bg-primary" />
            </div>
          )}

          {/* Events with positioning */}
          {positioned.map((p) => {
            const ev = events.find((e) => e.id === p.id)!;
            if (!ev) return null;
            
            const start = new Date(ev.start_at);
            const end = new Date(ev.end_at);
            
            const visibleStart = new Date(date);
            visibleStart.setHours(DAY_START_H, 0, 0, 0);
            const visibleEnd = new Date(date);
            visibleEnd.setHours(DAY_END_H, 59, 59, 999);
            
            const dayStart = startOfDay(date);
            const dayEnd = endOfDay(date);
            
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
            
            const visibleStart = new Date(date);
            visibleStart.setHours(DAY_START_H, 0, 0, 0);
            const visibleEnd = new Date(date);
            visibleEnd.setHours(DAY_END_H, 59, 59, 999);
            
            const dayStart = startOfDay(date);
            const dayEnd = endOfDay(date);
            
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
        </div>
      </div>
    </div>
  );
}