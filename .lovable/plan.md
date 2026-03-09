

# Dashboard Pixel Perfect — Final 10/10 Implementation

With the user's 5 refinements applied to the approved plan.

## Files to create (2)

### `src/features/dashboard/hooks/useRevenueTrend.ts`
- Query `coach_clients` for coach ID, then `orders` with `paid_at IS NOT NULL` and `created_at` in last 6 months
- Group by month, sum `paid_amount_cents`
- Return `{ data: { month: string, amount: number }[], currentMonth: number, percentChange: number }`

### `src/features/dashboard/components/ActivityTrendCard.tsx`
- Full-width card: `bg-card border border-border rounded-2xl p-6`
- **Header layout** (stats in header, NOT footer):
  - Title: `Andamento attività` — `text-lg font-semibold`
  - Amount: `text-2xl font-semibold tabular-nums`
  - Percent badge: `text-sm text-accent font-medium` with TrendingUp icon
- **Chart** (`h-48`): Recharts `AreaChart`
  - Stroke: `hsl(var(--accent))`, `strokeWidth={2.5}`, `dot={false}`
  - Fill: accent at `fillOpacity={0.1}`
  - **Refinement 4**: Light horizontal `CartesianGrid` — `vertical={false} strokeDasharray="3 3" className="stroke-border/50"`
  - **Refinement 5**: Tooltip with `shadow-md` (not shadow-lg), `bg-card border rounded-lg text-sm`
- Empty state: centered "Nessun dato disponibile"

## Files to modify (7)

### `DashboardHeader.tsx`
- Remove 3 buttons, single CTA: `+ Crea evento`
- **Refinement 1**: Keep `<Button>` component with className override: `bg-foreground text-primary-foreground rounded-lg px-4 py-2.5 font-medium shadow-sm hover:bg-foreground/90`
- Icon: `CalendarPlus h-4 w-4`, navigate to `/calendar`

### `Dashboard.tsx`
- New section order: Header → KpiStrip → ActivityTrendCard → Hero+Pending grid → Attention grid
- All using existing `space-y-6` and `gap-6`

### `TodayEventsCard.tsx`
- Background: `bg-gradient-to-b from-neutral-950 to-neutral-900` (already done)
- Title: `text-xl font-semibold`, divider `border-b border-white/8 pb-3 mb-3`
- **Event rows as pills**: `rounded-xl px-4 py-3 cursor-pointer transition-all duration-200`
  - Normal: `bg-white/5 hover:bg-white/10`
  - **Refinement 2**: `hover:translate-y-[-1px]` instead of `hover:scale-[1.01]`
  - **Refinement 3**: Next event uses `bg-accent/20 ring-1 ring-accent/30` instead of left border
- Row gap: `gap-2`
- **NextEventBanner split into 2 lines**:
  - Line 1: `Prossimo evento` — `text-accent font-medium text-xs`
  - Line 2: `20:15 — Test Test` — `text-primary-foreground/70 text-sm`
- Empty state icon: `text-muted-foreground/60`

### `PendingActionsCard.tsx`
- Row: `px-3 py-2 rounded-lg hover:bg-accent/10 hover:text-foreground transition-colors`
- Empty: `py-4 space-y-1`, icon `text-muted-foreground/60`

### `ClientsLowSessionsCard.tsx`
- Row hover: `hover:bg-accent/10 hover:text-foreground`
- Empty: `py-4 space-y-1`, icon `text-muted-foreground/60`

### `InactiveClientsCard.tsx`
- Row hover: `hover:bg-accent/10 hover:text-foreground`
- Empty: `py-4 space-y-1`, icon `text-muted-foreground/60`

### `KpiStrip.tsx`
- Add optional `trend` prop to `KpiCard` (renders small text if provided, nothing otherwise — future-ready, no visual change now)

