import { parseISO, startOfDay, addMinutes, format, isBefore, isAfter, addHours, setHours, startOfMinute } from "date-fns";
import type { AvailabilityWindow, OutOfOfficeBlock, AvailableSlot } from "../types";
import type { EventWithClient } from "@/features/events/types";

// FASE 2: Generate full day grid for coach mode
export interface FullDayGridOptions {
  date: Date;
  startHour?: number; // default 6
  endHour?: number; // default 22
  granularityMinutes?: number; // default 15
}

/**
 * Genera una griglia oraria completa per il coach mode
 * Usato per renderizzare il calendario interattivo anche senza availability configurate
 */
export function generateFullDayGrid({
  date,
  startHour = 6,
  endHour = 22,
  granularityMinutes = 15
}: FullDayGridOptions): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const dayStart = startOfDay(date);
  
  let currentTime = setHours(dayStart, startHour);
  currentTime.setMinutes(0, 0, 0);
  
  const endTime = setHours(dayStart, endHour);
  endTime.setMinutes(0, 0, 0);
  
  while (isBefore(currentTime, endTime)) {
    const slotEnd = addMinutes(currentTime, granularityMinutes);
    
    slots.push({
      start: currentTime.toISOString(),
      end: slotEnd.toISOString(),
    });
    
    currentTime = slotEnd;
  }
  
  return slots;
}

interface SlotGeneratorOptions {
  date: Date;
  slotDurationMinutes: number;
  bufferBetweenMinutes?: number;
  minAdvanceNoticeHours: number;
  availabilityWindows: AvailabilityWindow[];
  outOfOfficeBlocks: Array<{ start_at: string; end_at: string }>;
  existingEvents: Array<{ start_at: string; end_at: string }>;
}

/**
 * Generates available time slots for a given date based on:
 * - Availability windows (recurring weekly schedule)
 * - Out-of-office blocks
 * - Minimum advance notice
 * - Existing approved and pending events
 */
export function generateAvailableSlots({
  date,
  slotDurationMinutes,
  bufferBetweenMinutes = 0,
  minAdvanceNoticeHours,
  availabilityWindows,
  outOfOfficeBlocks,
  existingEvents,
}: SlotGeneratorOptions): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convert Sunday=0 to Monday=0
  const now = new Date();
  const minStartTime = addHours(now, minAdvanceNoticeHours);

  // Get availability windows for this day
  const dayWindows = availabilityWindows.filter(w => w.day_of_week === dayOfWeek);

  for (const window of dayWindows) {
    // Parse window times
    const [startHour, startMin] = window.start_time.split(':').map(Number);
    const [endHour, endMin] = window.end_time.split(':').map(Number);

    let currentSlotStart = startOfDay(date);
    currentSlotStart.setHours(startHour, startMin, 0, 0);

    const windowEnd = startOfDay(date);
    windowEnd.setHours(endHour, endMin, 0, 0);

    // Generate slots considering buffer between slots
    const incrementMinutes = bufferBetweenMinutes > 0 ? 5 : 5; // Always 5min for granular positioning
    while (isBefore(currentSlotStart, windowEnd)) {
      const slotEnd = addMinutes(currentSlotStart, slotDurationMinutes);

      // Check if slot end + buffer exceeds window end
      if (isAfter(slotEnd, windowEnd)) break;

      // Check minimum advance notice
      if (isBefore(currentSlotStart, minStartTime)) {
        currentSlotStart = addMinutes(currentSlotStart, 5);
        continue;
      }

      // Check if slot overlaps with OOO block
      const overlapsOOO = outOfOfficeBlocks.some(block => {
        const blockStart = parseISO(block.start_at);
        const blockEnd = parseISO(block.end_at);
        return (
          (isBefore(currentSlotStart, blockEnd) && isAfter(slotEnd, blockStart)) ||
          (isBefore(currentSlotStart, blockStart) && isAfter(slotEnd, blockEnd))
        );
      });

      if (overlapsOOO) {
        currentSlotStart = addMinutes(currentSlotStart, 5);
        continue;
      }

      // Check if slot overlaps with existing event
      const overlapsEvent = existingEvents.some(event => {
        const eventStart = parseISO(event.start_at);
        const eventEnd = parseISO(event.end_at);
        return (
          (isBefore(currentSlotStart, eventEnd) && isAfter(slotEnd, eventStart)) ||
          (isBefore(currentSlotStart, eventStart) && isAfter(slotEnd, eventEnd))
        );
      });

      if (overlapsEvent) {
        currentSlotStart = addMinutes(currentSlotStart, 5);
        continue;
      }

      // Slot is available
      slots.push({
        start: currentSlotStart.toISOString(),
        end: slotEnd.toISOString(),
      });

      // Move to next slot start + buffer (the buffer is invisible to clients)
      currentSlotStart = addMinutes(currentSlotStart, slotDurationMinutes + bufferBetweenMinutes);
    }
  }

  return slots;
}

/**
 * Finds the 3 nearest available slots to a requested time
 * @param excludeStart - Optional ISO string to exclude (e.g., the originally requested slot)
 */
export function findNearestSlots(
  requestedStart: Date,
  allSlots: AvailableSlot[],
  excludeStart?: string
): AvailableSlot[] {
  // Normalize excludeStart to minute precision for reliable comparison
  // This handles: different ISO formats, timezone offsets, seconds/milliseconds differences
  const excludeMinuteTimestamp = excludeStart 
    ? startOfMinute(parseISO(excludeStart)).getTime() 
    : null;

  // Filter out the excluded slot using normalized timestamp comparison
  const filteredSlots = excludeMinuteTimestamp
    ? allSlots.filter(slot => {
        const slotMinuteTimestamp = startOfMinute(parseISO(slot.start)).getTime();
        return slotMinuteTimestamp !== excludeMinuteTimestamp;
      })
    : allSlots;

  // Sort slots by distance from requested time
  const sorted = filteredSlots
    .map(slot => ({
      slot,
      distance: Math.abs(parseISO(slot.start).getTime() - requestedStart.getTime()),
    }))
    .sort((a, b) => a.distance - b.distance);

  return sorted.slice(0, 3).map(s => s.slot);
}

/**
 * Formats a time slot for display
 */
export function formatSlot(slot: AvailableSlot): string {
  const start = parseISO(slot.start);
  const end = parseISO(slot.end);
  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
}
