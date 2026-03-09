

# Dashboard Implementation Plan

## What exists now
- `src/pages/Dashboard.tsx` does NOT exist
- `/dashboard` route is NOT in `App.tsx` — currently `/` maps to `<Clients />`
- Two existing hooks: `useDashboardStats` (client counts) and `useUpcomingEvents` (7-day events)
- `useTopbar({ title: "..." })` pattern used by all coach pages
- `SectionShell` provides consistent padding (`px-4 sm:px-6 lg:px-8 xl:px-10`)
- `AuthContext` provides `userId` via `useAuth()`

## Files to create (13 new) + modify (3 existing)

### New: Data Hooks (5 files)

**`src/features/dashboard/hooks/useTodayEvents.ts`**
- Query events table for today (startOfDay to endOfDay), joined with client names
- Returns list with `id, title, start_at, end_at, client_name, coach_client_id`
- Marks "next" event (first event with start_at > now and within 2 hours)
- Reuses pattern from `useUpcomingEvents` but filtered to today only

**`src/features/dashboard/hooks/usePendingActions.ts`**
- 3 parallel queries:
  - `booking_requests` where status = 'PENDING' → count
  - `booking_requests` where status = 'COUNTER_PROPOSED' → count
  - `orders` where status not in ('paid', 'canceled', 'refunded') → count
- Returns array of `{ type, count, label, navigateTo }`

**`src/features/dashboard/hooks/useClientsLowSessions.ts`**
- Query `package` table joined with `coach_clients` → `clients`
- Compute remaining = total_sessions - consumed_sessions per coach_client
- Filter remaining <= 2, order ASC, limit 5
- Returns `{ client_id, first_name, last_name, remaining }`

**`src/features/dashboard/hooks/useInactiveClients.ts`**
- Get all coach_client_ids, then for each find MAX(events.start_at)
- Filter where max_event_date < now - 30 days AND max_event_date IS NOT NULL
- Order by days_since DESC, limit 5
- Returns `{ client_id, first_name, last_name, days_since_last_event }`

**`src/features/dashboard/hooks/useDashboardKpis.ts`**
- Combines: today events count (from useTodayEvents), total clients (from useDashboardStats), unpaid amount (from orders query)
- Returns 3 KPI objects with value + sublabel

### New: UI Components (7 files)

**`src/features/dashboard/components/DashboardHeader.tsx`**
- Time-aware greeting: Buongiorno/Buon pomeriggio/Buonasera + coach name from `coaches` or `auth.user.email`
- Subtitle: "Ecco la tua giornata in sintesi"
- Quick actions row: "Crea evento" (primary), "Aggiungi cliente" (outline), "Registra pagamento" (outline)
- Typography: greeting `text-[19px] font-semibold`, subtitle `text-sm text-muted-foreground`

**`src/features/dashboard/components/KpiStrip.tsx`**
- 3 cards in a row (grid-cols-1 md:grid-cols-3)
- Each card: neutral `bg-card border rounded-xl p-6`, no colored borders
- Label `text-sm text-muted-foreground`, number `text-3xl font-semibold tabular-nums`, sublabel `text-xs text-muted-foreground`
- KPIs: Events today, Clienti totali, Da incassare
- Icon in each card: small, `text-muted-foreground`

**`src/features/dashboard/components/TodayEventsCard.tsx`**
- Card title: "Eventi di oggi" `text-[17px] font-semibold`
- List of events: time | client name | title, max 6 rows
- "Next event" subtle highlight when within 2 hours
- Footer: "Vedi calendario completo →" link always visible
- Empty state: left-aligned, compact (py-6), Calendar icon 48px, title + description + CTA

**`src/features/dashboard/components/PendingActionsCard.tsx`**
- Human-readable items: "2 richieste di prenotazione da gestire", etc.
- Each item clickable → navigates to relevant page
- Empty state: CheckCircle icon, "Tutto sotto controllo", "Non ci sono azioni da gestire"

**`src/features/dashboard/components/ClientsLowSessionsCard.tsx`**
- List: "Anna Verdi — 1 sessione rimasta", max 5
- Empty state: "Nessun cliente con sessioni in esaurimento"

**`src/features/dashboard/components/InactiveClientsCard.tsx`**
- List: "Mario Rossi — Ultimo evento: 34 giorni fa", max 5
- Empty state: "Tutti i clienti sono attivi"

**`src/features/dashboard/components/DashboardSkeleton.tsx`**
- Skeleton placeholders for all sections: header, KPI strip, events card, actions card, bottom cards

### New: Page

**`src/pages/Dashboard.tsx`**
- Calls `useTopbar({ title: "Dashboard" })`
- Layout using SectionShell (no title prop, just padding)
- Grid: `gap-8` between sections
- Section order:
  1. DashboardHeader (greeting + actions)
  2. KpiStrip (3 cards)
  3. Row: TodayEventsCard (lg:col-span-8) + PendingActionsCard (lg:col-span-4)
  4. Row: ClientsLowSessionsCard (lg:col-span-6) + InactiveClientsCard (lg:col-span-6)

### Modified: Routing

**`src/App.tsx`**
- Add `import Dashboard from "./pages/Dashboard"`
- Change `<Route path="/" element={<Clients />} />` to `<Route path="/" element={<Navigate to="/dashboard" replace />} />`
- Add `<Route path="/dashboard" element={<Dashboard />} />`
- Add `<Route path="/clients" element={<Clients />} />`

### Modified: Navigation

**`src/components/AppSidebar.tsx`**
- Add Dashboard as first item: `{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }`
- Change Clienti to: `{ label: "Clienti", to: "/clients", icon: Users }`
- Update active logic: Dashboard active only on `/dashboard`; Clienti active on `/clients/*`

**`src/components/MobileNav.tsx`**
- Same nav changes as AppSidebar

### Design rules (from memory context)
- Cards: `bg-card border border-border rounded-xl p-6` (radius-md = 12px)
- No colored top borders
- All content left-aligned
- Empty states: 48px icon, 16px semibold title, 14px description
- `gap-8` between sections
- Hover on rows: `hover:bg-muted/50 transition-colors duration-200`
- Typography: 19px page headers, 17px card titles, 14px body, 13px captions
- Tabular nums for KPI values

