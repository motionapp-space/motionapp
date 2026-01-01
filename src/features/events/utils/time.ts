// Time utilities for calendar views
// Optimized for 11+ hours visible in viewport

export const DAY_START_H = 6;    // 06:00 - coach working hours
export const DAY_END_H = 22;     // 22:00 - 16 hours total
export const MINUTE_HEIGHT = 0.68; // 0.68px per minute → ~11h visible in 500px

export const toMinutes = (d: Date) => d.getHours() * 60 + d.getMinutes();

export const clamp = (v: number, min: number, max: number) => 
  Math.max(min, Math.min(max, v));

export const minutesFromDayStart = (date: Date) => {
  const m = toMinutes(date);
  const startM = DAY_START_H * 60;
  return Math.max(0, m - startM);
};

export const minutesVisible = () => (DAY_END_H - DAY_START_H) * 60; // 16h → 960m

export const hoursArray = () => {
  const out: number[] = [];
  for (let h = DAY_START_H; h <= DAY_END_H; h++) out.push(h);
  return out;
};
