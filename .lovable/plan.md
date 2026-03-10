

# Dashboard Accessibility — Contrast Fix

## Problem

Two categories of low-contrast text across dashboard cards:

1. **CTA links using `text-accent`** — the accent token is HSL 222 35% **68%** lightness. On a ~98% lightness background, this produces a contrast ratio of roughly **2.2:1**, far below the WCAG AA minimum of 4.5:1. Affected:
   - `UpcomingEventsCard.tsx` line 87 — "Vai al calendario"
   - `PendingActionsCard.tsx` line 55 — "Vedi dettagli"
   - (TodayEventsCard already fixed to `text-accent-strong`)

2. **Chart axis labels** in `ActivityTrendCard.tsx` — `muted-foreground` with `fillOpacity: 0.7` / `0.8` further reduces an already-muted color, making axis text hard to read.

## Changes

### UpcomingEventsCard.tsx (line 87)
`text-accent` → `text-accent-strong` (same fix already applied to TodayEventsCard)

### PendingActionsCard.tsx (line 55)
`text-accent` → `text-accent-strong`

### ActivityTrendCard.tsx (lines 147, 154)
- XAxis tick: `fillOpacity: 0.8` → remove (use full opacity)
- YAxis tick: `fillOpacity: 0.7` → `fillOpacity: 0.85`

3 files, 4 line-level edits. No visual weight added — just contrast correction.

