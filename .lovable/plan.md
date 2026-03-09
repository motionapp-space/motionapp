

# Dashboard Motion — UX/UI Premium Refinement (v2)

Implementation plan for the approved dashboard overhaul. 9 files (1 new + 8 edits), no backend changes.

---

## Files and Changes

### 1. `Dashboard.tsx` — New grid layout

```text
Row 1:  KpiStrip (3-col, unchanged internally)
Row 2:  ActivityTrendCard (lg:col-span-8) + PendingActionsCard (lg:col-span-4)
Row 3:  TodayEventsCard (lg:col-span-1) + UpcomingEventsCard (lg:col-span-1)
Row 4:  ClientsLowSessionsCard + InactiveClientsCard (unchanged)
```

Remove the current `space-y-5` wrapper around chart+events. Replace with flat `space-y-6` rows. Import new `UpcomingEventsCard`. Move `ActivityTrendCard` into 8/12 column, `PendingActionsCard` stays 4/12. Row 3 becomes `grid-cols-2` with Today + Upcoming.

### 2. `KpiStrip.tsx` — Subtler hierarchy

- Icons: `h-5 w-5 text-muted-foreground` (from `h-6 w-6 text-accent-strong`)
- Value: `text-3xl` (from `text-4xl`)
- Card spacing: `space-y-2` (from `space-y-3`)
- Add `hover:shadow-sm transition-shadow duration-200`
- Card 3 sublabel: `"X pagamenti da registrare"` (from `"X elementi non pagati"`)

### 3. `ActivityTrendCard.tsx` — Chart refinement

- Title: "Andamento ricavi" (was "Andamento attività")
- Trend label: append " vs mese precedente" after percentage
- Period selector: `useState<6 | 12>(6)` with two toggle buttons (6M / 12M) in header top-right, pass to `useRevenueTrend(months)`
- Chart height: `h-44` (from `h-48`)
- Y-axis: visible with `formatCents` tick formatter, `width={55}`, `axisLine={false}`, `tickLine={false}`
- Stroke: `strokeWidth={3}`
- Custom dot on last data point only (filled accent circle)
- Skeleton height adjusted to match

### 4. `useRevenueTrend.ts` — Accept months param

- Signature: `useRevenueTrend(months: number = 6)`
- `fetchRevenueTrend(userId, months)` — change `subMonths(now, 5)` to `subMonths(now, months - 1)`, same for loop initialization
- Query key: `["dashboard", "revenueTrend", userId, months]`

### 5. `TodayEventsCard.tsx` — Light accent, remove dark theme

- With events: `bg-accent/4 border border-accent/12 rounded-2xl p-6` (no dark gradient)
- Event rows: `bg-accent/8 hover:bg-accent/12`, next event `bg-accent/15 ring-1 ring-accent/30`
- All text: `text-foreground`, `text-muted-foreground` (no `text-white/*`)
- Separator: `border-border`
- CTA: standard `text-accent`

### 6. `UpcomingEventsCard.tsx` — **New file**

- Standard card: `bg-card border border-border rounded-2xl p-6` (neutral, visually lighter than Today)
- Uses `useUpcomingEvents()`, filters out today's events (compare `startOfDay`)
- Max 5 events, compact rows `py-2.5 px-3`
- Row format: relative day label + time + " — " + client name (e.g., "Domani · 10:00 — Harry Potter")
- CTA: "Vai al calendario →"
- Empty state: Calendar icon `text-muted-foreground/40`, "Nessun evento in programma", "I prossimi appuntamenti appariranno qui", Button to calendar

### 7. `PendingActionsCard.tsx` — Operational copy, no dots

- Max 3 actions shown, overflow: "+N altre azioni" text
- No colored dot indicators
- Row: `px-3 py-2.5 rounded-lg hover:bg-accent/10`
- Bottom CTA: "Vedi dettagli →" linking to first action's `navigateTo`, only when actions exist
- Empty state: title "Tutto in ordine", subtitle "Nessuna azione richiesta"

### 8. `ClientsLowSessionsCard.tsx` — Polish

- Row hover: `hover:-translate-y-[1px] transition-transform`
- Gap: `gap-1` (from `gap-0.5`)
- Empty icon: `text-muted-foreground/40`
- Empty title: "Nessun pacchetto in esaurimento"
- Empty container: `py-6`

### 9. `InactiveClientsCard.tsx` — Polish

- Row hover: `hover:-translate-y-[1px] transition-transform`
- Gap: `gap-1`
- Empty icon: `text-muted-foreground/40`
- Empty container: `py-6`

---

## Technical Notes

- `useUpcomingEvents` already fetches next 7 days including today — filter client-side with `isAfter(startOfDay(event.start_at), endOfDay(today))` to exclude today's events
- The `useRevenueTrend` months param uses React Query prefix matching, so `["dashboard", "revenueTrend"]` invalidation from cache sync still works
- No new dependencies needed

