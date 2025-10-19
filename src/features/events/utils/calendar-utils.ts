import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isSameDay, isSameMonth, parseISO, startOfDay, endOfDay } from "date-fns";
import { it } from "date-fns/locale";
import type { EventWithClient } from "../types";

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { locale: it, weekStartsOn: 1 });
  const end = endOfWeek(date, { locale: it, weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthDays(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = eachDayOfInterval({ start, end });

  // Add days from previous month to fill first week
  const firstDay = startOfWeek(days[0], { locale: it, weekStartsOn: 1 });
  const prefixDays = eachDayOfInterval({ start: firstDay, end: addDays(days[0], -1) });

  // Add days from next month to fill last week
  const lastDay = endOfWeek(days[days.length - 1], { locale: it, weekStartsOn: 1 });
  const suffixDays = eachDayOfInterval({ start: addDays(days[days.length - 1], 1), end: lastDay });

  return [...prefixDays, ...days, ...suffixDays];
}

export function getEventsForDay(events: EventWithClient[], day: Date): EventWithClient[] {
  return events.filter(event => {
    const eventStart = parseISO(event.start_at);
    const eventEnd = parseISO(event.end_at);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    return (eventStart >= dayStart && eventStart < dayEnd) ||
           (eventEnd > dayStart && eventEnd <= dayEnd) ||
           (eventStart < dayStart && eventEnd > dayEnd);
  });
}

export function getEventsForTimeSlot(events: EventWithClient[], day: Date, hour: number): EventWithClient[] {
  return events.filter(event => {
    const eventStart = parseISO(event.start_at);
    const eventEnd = parseISO(event.end_at);
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(day);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    
    return (eventStart >= slotStart && eventStart < slotEnd) ||
           (eventEnd > slotStart && eventEnd <= slotEnd) ||
           (eventStart < slotStart && eventEnd > slotEnd);
  });
}

export function formatTimeRange(start: string, end: string, isAllDay?: boolean): string {
  if (isAllDay) return "Tutto il giorno";
  const startTime = format(parseISO(start), "HH:mm", { locale: it });
  const endTime = format(parseISO(end), "HH:mm", { locale: it });
  return `${startTime} - ${endTime}`;
}

export function getEventDuration(start: string, end: string): number {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60); // minutes
}

export function isEventInPast(end: string): boolean {
  return parseISO(end) < new Date();
}

export function groupEventsByMonth(events: EventWithClient[]): Map<string, EventWithClient[]> {
  const grouped = new Map<string, EventWithClient[]>();
  
  events.forEach(event => {
    const monthKey = format(parseISO(event.start_at), "yyyy-MM");
    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(event);
  });
  
  return grouped;
}
