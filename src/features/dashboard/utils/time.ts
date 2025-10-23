// UTC time utilities for consistent date ranges (no DST drift)

export const endOfTodayUTC = (): number => {
  const d = new Date();
  // Use local date values to get today's date, then convert to UTC timestamp
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
};

export const addDaysUTC = (ts: number, days: number): number => {
  const d = new Date(ts);
  // Use local date values for consistent day arithmetic
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + days, 23, 59, 59, 999);
};

export const startWindow7dUTC = (): number => addDaysUTC(endOfTodayUTC(), -6); // 7 days inclusive
export const startWindow30dUTC = (): number => addDaysUTC(endOfTodayUTC(), -29); // 30 days inclusive

export const startWindow12mUTC = (): number => {
  const d = new Date();
  // Go back 12 months from today using local date values
  return Date.UTC(d.getFullYear() - 1, d.getMonth(), d.getDate(), 0, 0, 0, 0);
};

export const normalizeDateToUTC = (date: string | number | Date): number => {
  const dt = new Date(date);
  return Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 23, 59, 59, 999);
};
