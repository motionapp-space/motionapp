// Time utilities for calendar views
export const DAY_START_H = 0;   // 00:00
export const DAY_END_H = 24;    // 24:00
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

export const hoursArray = () => {
  const out: number[] = [];
  for (let h = DAY_START_H; h <= DAY_END_H; h++) out.push(h);
  return out;
};
