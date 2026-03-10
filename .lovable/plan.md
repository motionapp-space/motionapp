

# Swap "Eventi di oggi" and "Azioni in sospeso" positions

Currently in `Dashboard.tsx`:
- Row 2: `ActivityTrendCard` (8/12) + `PendingActionsCard` (4/12)
- Row 3: `TodayEventsCard` (6/12) + `UpcomingEventsCard` (6/12)

**New layout:**
- Row 2: `ActivityTrendCard` (8/12) + `TodayEventsCard` (4/12)
- Row 3: `PendingActionsCard` (6/12) + `UpcomingEventsCard` (6/12)

Single file edit in `Dashboard.tsx` — swap the two components between rows.

