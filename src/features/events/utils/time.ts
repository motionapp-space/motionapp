// Time utilities for calendar views
export const DAY_START_H = 5;   // 05:00
export const DAY_END_H = 23;    // 23:00
export const MINUTE_HEIGHT = 1; // 1px per minute

export const toMinutes = (d: Date) => d.getHours() * 60 + d.getMinutes();

export const clamp = (v: number, min: number, max: number) => 
  Math.max(min, Math.min(max, v));

export const minutesFromDayStart = (date: Date) => {
  const m = toMinutes(date);
  const startM = DAY_START_H * 60;
  return Math.max(0, m - startM);
};

export const minutesVisible = () => (DAY_END_H - DAY_START_H) * 60; // 18h -> 1080m
