// UTC time utilities for consistent date ranges (no DST drift)

export const endOfTodayUTC = (): number => {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999);
};

export const addDaysUTC = (ts: number, days: number): number => {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days, 23, 59, 59, 999);
};

export const startWindow7dUTC = (): number => addDaysUTC(endOfTodayUTC(), -6); // 7 days inclusive
export const startWindow30dUTC = (): number => addDaysUTC(endOfTodayUTC(), -29); // 30 days inclusive

export const startWindow12mUTC = (): number => {
  const end = endOfTodayUTC();
  const d = new Date(end);
  return Date.UTC(d.getUTCFullYear() - 1, d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
};

export const normalizeDateToUTC = (date: string | number | Date): number => {
  const dt = new Date(date);
  return Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 23, 59, 59, 999);
};
