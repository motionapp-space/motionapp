

# Dashboard Consistency & Visual Hierarchy Refinements

## Summary
Refactoring the dashboard to match Motion's established UI patterns: consistent topbar, neutral cards, left-aligned content, and compact empty states.

---

## Changes Overview

### 1. Page Structure
**Dashboard.tsx** (new file at `src/pages/Dashboard.tsx`)
- Uses `useTopbar({ title: "Dashboard" })` like all other pages
- No greeting section - starts directly with quick actions
- Uses `SectionShell` for consistent lateral padding

### 2. Routing & Navigation
**App.tsx**
- Add `/dashboard` route → Dashboard component
- Change `/` from `<Clients />` to `<Navigate to="/dashboard" replace />`

**AppSidebar.tsx & MobileNav.tsx**
- Add "Dashboard" as first nav item (`/dashboard`, LayoutDashboard icon)
- Update "Clienti" route to `/clients`

---

## Component Specifications

### Quick Actions Bar
```
[ Crea evento ]  [ Aggiungi cliente ]  [ Registra pagamento ]
     ↑ primary (default)      ↑ outline          ↑ outline
```
- Horizontal row, `gap-3`
- Primary button for "Crea evento"

### KPI Strip (3 cards)
- **Typography hierarchy:**
  - Label: `text-sm text-muted-foreground`
  - Number: `text-3xl font-semibold tabular-nums`
  - Description: `text-xs text-muted-foreground`
- **Cards:** Neutral `bg-card border rounded-xl p-6`
- **No colored borders**
- **Icon:** Small, `text-muted-foreground` (not accent color)
- **Copy fix:** "Clienti totali" instead of "Nel tuo roster"

### Event Card
- **Title:** `text-lg font-semibold`
- **Content:** Left-aligned list
- **Empty state:** Compact (`py-6`), left-aligned
  ```
  [calendar icon]
  Nessun evento oggi
  Non ci sono eventi in programma per oggi
  [+ Crea evento]
  ```

### Pending Actions Card
- Same neutral card style
- **Empty state:**
  ```
  [check icon]
  Tutto sotto controllo
  Non ci sono azioni da gestire
  ```

### Clients Low Sessions & Inactive Cards
- Simple list with left-aligned content
- Empty state: "Nessun cliente con sessioni in esaurimento"

---

## Design Specs (matching existing patterns)

**Card Styling:**
```
bg-card border border-border rounded-xl shadow-none
```

**Section Spacing:**
- `gap-8` between major sections
- `p-6` inside cards

**Typography (from memory):**
- Section titles: `text-lg font-semibold` (19px)
- Body: `text-sm` (14px)
- Descriptions: `text-xs text-muted-foreground`

**Empty States:**
- Icon: 48px, `text-muted-foreground`
- Title: `text-base font-semibold` (16px)
- Description: `text-sm text-muted-foreground` (14px)
- All content left-aligned
- Compact height: `min-h-[160px]` not `min-h-[320px]`

**No hover lift effects** (removed per feedback)

---

## Data Hooks Needed

1. **useTodayEvents** - filter today's events
2. **usePendingActions** - booking requests, counter-proposals, unpaid payments
3. **useClientsLowSessions** - remaining sessions ≤ 2
4. **useInactiveClients** - last event > 30 days ago

Reuse existing `useDashboardStats` for client count.

---

## Grid Layout

```
Desktop:
┌──────────────────────────────────────────┐
│ Quick Actions (horizontal)               │
├──────────────────────────────────────────┤
│ KPI   │   KPI   │   KPI                  │
├────────────────────┬─────────────────────┤
│ Eventi di oggi     │ Azioni in sospeso   │
│ (8 cols)           │ (4 cols)            │
├────────────────────┼─────────────────────┤
│ Sessioni in        │ Clienti inattivi    │
│ esaurimento (6col) │ (6 cols)            │
└────────────────────┴─────────────────────┘

Mobile: Vertical stack, same order
```

---

## Implementation Steps

1. Create Dashboard page with useTopbar
2. Create KpiStrip with neutral cards
3. Create TodayEventsCard with compact empty state
4. Create PendingActionsCard with positive empty state
5. Create ClientsLowSessionsCard
6. Create InactiveClientsCard
7. Create data hooks
8. Update App.tsx routing
9. Update AppSidebar + MobileNav navigation

