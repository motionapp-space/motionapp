import { parseISO, addMinutes, startOfDay, differenceInMinutes } from "date-fns";
import type { AvailabilityWindow, AvailableSlot } from "../types";
import { generateAvailableSlots } from "./slot-generator";

interface SnapToSlotOptions {
  requestedStart: Date;
  requestedEnd: Date;
  availabilityWindows: AvailabilityWindow[];
  existingEvents: Array<{ start_at: string; end_at: string; id?: string }>;
  outOfOfficeBlocks: Array<{ start_at: string; end_at: string; id?: string }>;
  slotDurationMinutes: number;
  bufferBetweenMinutes: number;
  minAdvanceNoticeHours: number;
}

interface SnapResult {
  snapped: boolean;
  slot: AvailableSlot | null;
  alternatives: AvailableSlot[];
  reason?: string;
}

/**
 * Attempts to snap a requested time range to the nearest available slot
 */
export function snapToSlot(options: SnapToSlotOptions): SnapResult {
  const {
    requestedStart,
    requestedEnd,
    availabilityWindows,
    existingEvents,
    outOfOfficeBlocks,
    slotDurationMinutes,
    bufferBetweenMinutes,
    minAdvanceNoticeHours,
  } = options;

  const requestedDuration = differenceInMinutes(requestedEnd, requestedStart);

  // Generate all available slots for the requested day
  const allSlots = generateAvailableSlots({
    date: requestedStart,
    slotDurationMinutes,
    bufferBetweenMinutes,
    minAdvanceNoticeHours,
    availabilityWindows,
    outOfOfficeBlocks,
    existingEvents,
  });

  if (allSlots.length === 0) {
    return {
      snapped: false,
      slot: null,
      alternatives: [],
      reason: "Nessuno slot disponibile per questa giornata",
    };
  }

  // Try to find exact match
  const exactMatch = allSlots.find((slot) => {
    const slotStart = parseISO(slot.start);
    const slotEnd = parseISO(slot.end);
    return (
      Math.abs(differenceInMinutes(slotStart, requestedStart)) < 5 &&
      Math.abs(differenceInMinutes(slotEnd, requestedEnd)) < 5
    );
  });

  if (exactMatch) {
    return {
      snapped: true,
      slot: exactMatch,
      alternatives: allSlots.filter((s) => s !== exactMatch).slice(0, 3),
    };
  }

  // Find nearest slot by start time
  const sortedByDistance = allSlots
    .map((slot) => ({
      slot,
      distance: Math.abs(
        differenceInMinutes(parseISO(slot.start), requestedStart)
      ),
    }))
    .sort((a, b) => a.distance - b.distance);

  const nearest = sortedByDistance[0];

  if (nearest && nearest.distance <= 30) {
    // Within 30 minutes, consider it snappable
    return {
      snapped: true,
      slot: nearest.slot,
      alternatives: sortedByDistance.slice(1, 4).map((s) => s.slot),
    };
  }

  // Too far from any slot, return alternatives
  return {
    snapped: false,
    slot: null,
    alternatives: sortedByDistance.slice(0, 3).map((s) => s.slot),
    reason: "Orario troppo lontano dagli slot disponibili",
  };
}

/**
 * Checks if a time range conflicts with existing events or blocks
 */
export function hasConflict(
  start: Date,
  end: Date,
  existingEvents: Array<{ start_at: string; end_at: string; id?: string }>,
  outOfOfficeBlocks: Array<{ start_at: string; end_at: string; id?: string }>
): { hasConflict: boolean; reason?: string } {
  // Check events
  for (const event of existingEvents) {
    const eventStart = parseISO(event.start_at);
    const eventEnd = parseISO(event.end_at);

    if (start < eventEnd && end > eventStart) {
      return {
        hasConflict: true,
        reason: "Conflitto con un appuntamento esistente",
      };
    }
  }

  // Check OOO blocks
  for (const block of outOfOfficeBlocks) {
    const blockStart = parseISO(block.start_at);
    const blockEnd = parseISO(block.end_at);

    if (start < blockEnd && end > blockStart) {
      return {
        hasConflict: true,
        reason: "Conflitto con un blocco fuori ufficio",
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Checks if a time range is within availability windows
 */
export function isWithinAvailability(
  start: Date,
  end: Date,
  availabilityWindows: AvailabilityWindow[]
): boolean {
  const dayOfWeek = start.getDay() === 0 ? 6 : start.getDay() - 1; // Convert Sunday=0 to Monday=0
  const dayWindows = availabilityWindows.filter(
    (w) => w.day_of_week === dayOfWeek
  );

  if (dayWindows.length === 0) return false;

  const dayStart = startOfDay(start);
  const startMinutes =
    start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  return dayWindows.some((window) => {
    const [windowStartH, windowStartM] = window.start_time.split(":").map(Number);
    const [windowEndH, windowEndM] = window.end_time.split(":").map(Number);

    const windowStartMinutes = windowStartH * 60 + windowStartM;
    const windowEndMinutes = windowEndH * 60 + windowEndM;

    return (
      startMinutes >= windowStartMinutes && endMinutes <= windowEndMinutes
    );
  });
}
