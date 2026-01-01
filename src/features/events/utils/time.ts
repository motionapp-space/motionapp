// Time utilities for calendar views
// Optimized for ≥11 hours visible at 90% zoom on laptop

export const DAY_START_H = 0;    // 00:00 - full 24h visible
export const DAY_END_H = 24;     // 24:00 - full day (shows 00:00-23:00 labels)
export const MINUTE_HEIGHT = 0.94; // ~56.4px/ora → rendering sub-pixel stabile, ~11h visibili a zoom 90%

export const toMinutes = (d: Date) => d.getHours() * 60 + d.getMinutes();

export const clamp = (v: number, min: number, max: number) => 
  Math.max(min, Math.min(max, v));

export const minutesFromDayStart = (date: Date) => {
  const m = toMinutes(date);
  const startM = DAY_START_H * 60;
  return Math.max(0, m - startM);
};

export const minutesVisible = () => (DAY_END_H - DAY_START_H) * 60; // 24h → 1440m

export const hoursArray = () => {
  const out: number[] = [];
  // Show 00:00 to 23:00 labels (24 hour markers)
  for (let h = DAY_START_H; h < DAY_END_H; h++) out.push(h);
  return out;
};
