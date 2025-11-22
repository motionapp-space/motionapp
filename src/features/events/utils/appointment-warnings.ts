// FASE 1: Appointment Warnings System
// Fornisce warning non bloccanti per il coach quando crea appuntamenti fuori dalle regole clienti

import { parseISO, differenceInHours, differenceInMinutes } from "date-fns";
import type { AvailabilityWindow } from "@/features/bookings/types";

export type WarningType = 
  | 'outside_availability'
  | 'within_min_hours'
  | 'non_standard_duration'
  | 'overlapping_event';

export interface AppointmentWarning {
  type: WarningType;
  message: string;
  severity: 'info' | 'warning';
}

interface GetWarningsParams {
  start: Date;
  end: Date;
  availabilityWindows?: AvailabilityWindow[];
  minHoursBeforeBooking?: number;
  standardDurations?: number[]; // in minutes [30, 45, 60]
  existingEvents?: Array<{ start_at: string; end_at: string }>;
  now?: Date;
}

export function getAppointmentWarningsForCoach({
  start,
  end,
  availabilityWindows = [],
  minHoursBeforeBooking = 24,
  standardDurations = [30, 45, 60],
  existingEvents = [],
  now = new Date()
}: GetWarningsParams): AppointmentWarning[] {
  const warnings: AppointmentWarning[] = [];

  // 1. Check if outside availability windows
  if (availabilityWindows.length > 0) {
    const dayOfWeek = start.getDay() === 0 ? 6 : start.getDay() - 1; // Convert Sunday=0 to Monday=0
    const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    
    const hasMatchingWindow = availabilityWindows.some(window => {
      if (window.day_of_week !== dayOfWeek) return false;
      return startTime >= window.start_time && startTime < window.end_time;
    });

    if (!hasMatchingWindow) {
      warnings.push({
        type: 'outside_availability',
        message: 'Questo appuntamento è fuori dalle fasce di disponibilità che mostri ai tuoi clienti. Puoi comunque proseguire.',
        severity: 'warning'
      });
    }
  }

  // 2. Check if within min hours before booking
  const hoursUntilEvent = differenceInHours(start, now);
  if (hoursUntilEvent < minHoursBeforeBooking && hoursUntilEvent >= 0) {
    warnings.push({
      type: 'within_min_hours',
      message: `Stai creando un appuntamento entro le prossime ${minHoursBeforeBooking} ore. I tuoi clienti non potrebbero prenotare in questo orario, ma tu sì.`,
      severity: 'info'
    });
  }

  // 3. Check if duration is non-standard
  const durationMinutes = differenceInMinutes(end, start);
  if (!standardDurations.includes(durationMinutes)) {
    warnings.push({
      type: 'non_standard_duration',
      message: `La durata (${durationMinutes} min) non corrisponde a uno slot standard (${standardDurations.join('/')} min). Va bene comunque?`,
      severity: 'info'
    });
  }

  // 4. Check for overlapping events
  const hasOverlap = existingEvents.some(event => {
    const eventStart = parseISO(event.start_at);
    const eventEnd = parseISO(event.end_at);
    
    return (
      (start < eventEnd && end > eventStart) ||
      (start <= eventStart && end >= eventEnd)
    );
  });

  if (hasOverlap) {
    warnings.push({
      type: 'overlapping_event',
      message: 'Hai già un appuntamento in questo intervallo. Vuoi sovrapporre l\'evento?',
      severity: 'warning'
    });
  }

  return warnings;
}
