// UTC time utilities for consistent date ranges (no DST drift)

export const endOfTodayUTC = (): number => {
  const d = new Date();
  // Use local end-of-day timestamp to avoid +1 day shift
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
};

export const addDaysUTC = (ts: number, days: number): number => {
  const d = new Date(ts);
  // Use local end-of-day timestamp arithmetic
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, 23, 59, 59, 999).getTime();
};

export const startWindow7dUTC = (): number => addDaysUTC(endOfTodayUTC(), -6); // 7 days inclusive
export const startWindow30dUTC = (): number => addDaysUTC(endOfTodayUTC(), -29); // 30 days inclusive

export const startWindow12mUTC = (): number => {
  // Use last 365 days inclusive ending today
  return addDaysUTC(endOfTodayUTC(), -364);
};

export const normalizeDateToUTC = (date: string | number | Date): number => {
  const dt = new Date(date);
  return Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 23, 59, 59, 999);
};
