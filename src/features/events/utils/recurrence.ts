import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter, isSameDay, parseISO, startOfDay } from "date-fns";
import type { RecurrenceConfig } from "../components/RecurrenceSection";

interface GenerateOccurrencesOptions {
  startDate: Date;
  config: RecurrenceConfig;
  maxOccurrences?: number;
}

/**
 * Generates all occurrence dates based on recurrence configuration
 */
export function generateRecurrenceOccurrences({
  startDate,
  config,
  maxOccurrences = 100, // Safety limit
}: GenerateOccurrencesOptions): Date[] {
  if (!config.enabled) {
    return [startDate];
  }

  const occurrences: Date[] = [startDate];
  let currentDate = startDate;
  const interval = config.interval || 1;

  // Determine max occurrences based on endType
  let maxCount = maxOccurrences;
  if (config.endType === "count" && config.occurrenceCount) {
    maxCount = Math.min(config.occurrenceCount, maxOccurrences);
  }

  // Parse end date if applicable
  let endDate: Date | null = null;
  if (config.endType === "until" && config.endDate) {
    endDate = parseISO(config.endDate);
  }

  // Generate occurrences based on frequency
  while (occurrences.length < maxCount) {
    let nextDate: Date;

    switch (config.frequency) {
      case "daily":
        nextDate = addDays(currentDate, interval);
        break;

      case "weekly":
        // For weekly recurrence with specific days
        if (config.weekDays && config.weekDays.length > 0) {
          nextDate = findNextWeeklyOccurrence(currentDate, config.weekDays, interval);
        } else {
          nextDate = addWeeks(currentDate, interval);
        }
        break;

      case "monthly":
        nextDate = addMonths(currentDate, interval);
        // Se monthDay è esplicitamente impostato (es. "ogni mese il 15"),
        // forza quel giorno (gestendo mesi corti)
        if (config.monthDay && config.monthDay > 0) {
          const lastDayOfMonth = new Date(
            nextDate.getFullYear(),
            nextDate.getMonth() + 1,
            0
          ).getDate();
          nextDate.setDate(Math.min(config.monthDay, lastDayOfMonth));
        }
        // Se monthDay non è impostato, addMonths già mantiene il giorno originale
        // e gestisce i mesi corti automaticamente
        break;

      case "yearly":
        nextDate = addYears(currentDate, interval);
        break;

      default:
        nextDate = addWeeks(currentDate, interval);
    }

    // Check if we've exceeded the end date
    if (endDate && isAfter(nextDate, endDate)) {
      break;
    }

    // Skip if same day (shouldn't happen but safety check)
    if (!isSameDay(nextDate, currentDate)) {
      occurrences.push(nextDate);
    }

    currentDate = nextDate;

    // Safety check: if we're generating dates too far in the future, stop
    const twoYearsFromNow = addYears(new Date(), 2);
    if (isAfter(currentDate, twoYearsFromNow)) {
      break;
    }
  }

  return occurrences;
}

/**
 * Finds the next occurrence for weekly recurrence with specific weekdays
 */
function findNextWeeklyOccurrence(
  currentDate: Date,
  weekDays: number[],
  interval: number
): Date {
  const sortedDays = [...weekDays].sort((a, b) => a - b);
  const currentDay = currentDate.getDay();
  
  // Find next selected day in the same week
  const nextDayInWeek = sortedDays.find(day => day > currentDay);
  
  if (nextDayInWeek !== undefined) {
    // Move to next selected day in the same week
    const daysToAdd = nextDayInWeek - currentDay;
    return addDays(currentDate, daysToAdd);
  } else {
    // Move to first selected day in the next interval week
    const firstDay = sortedDays[0];
    const daysUntilNextWeek = 7 - currentDay + firstDay + (interval - 1) * 7;
    return addDays(currentDate, daysUntilNextWeek);
  }
}

/**
 * Filters occurrences to only include dates that have available slots
 */
export function filterOccurrencesByAvailability(
  occurrences: Date[],
  availableSlots: Array<{ start: string; end: string }>
): Date[] {
  const availableDates = new Set(
    availableSlots.map(slot => {
      const slotDate = new Date(slot.start);
      return startOfDay(slotDate).toISOString();
    })
  );

  return occurrences.filter(occurrence => {
    const occurrenceDay = startOfDay(occurrence).toISOString();
    return availableDates.has(occurrenceDay);
  });
}

/**
 * Formats recurrence rule as human-readable text (for future use)
 */
export function formatRecurrenceRule(config: RecurrenceConfig): string {
  if (!config.enabled) return "Nessuna ricorrenza";

  const parts: string[] = [];

  // Frequency
  switch (config.frequency) {
    case "daily":
      parts.push(config.interval === 1 ? "Ogni giorno" : `Ogni ${config.interval} giorni`);
      break;
    case "weekly":
      parts.push(config.interval === 1 ? "Ogni settimana" : `Ogni ${config.interval} settimane`);
      if (config.weekDays && config.weekDays.length > 0) {
        const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
        const days = config.weekDays.map(d => dayNames[d]).join(", ");
        parts.push(`(${days})`);
      }
      break;
    case "monthly":
      parts.push(config.interval === 1 ? "Ogni mese" : `Ogni ${config.interval} mesi`);
      break;
    case "yearly":
      parts.push(config.interval === 1 ? "Ogni anno" : `Ogni ${config.interval} anni`);
      break;
  }

  // End condition
  switch (config.endType) {
    case "until":
      if (config.endDate) {
        parts.push(`fino al ${config.endDate}`);
      }
      break;
    case "count":
      parts.push(`per ${config.occurrenceCount} volte`);
      break;
  }

  return parts.join(" ");
}
