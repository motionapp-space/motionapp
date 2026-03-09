
# Motion Coach Dashboard — Premium UX Refinements

## Overview
Implementing 10 visual and UX refinements to transform the dashboard into a premium "operational cockpit" aligned with Motion's brand identity.

---

## Implementation Plan

### 1. File Structure

**New/Modified Files:**
```
src/pages/Dashboard.tsx                          (new)
src/features/dashboard/components/
  ├── DashboardHeader.tsx                        (new)
  ├── KpiStrip.tsx                               (new)
  ├── TodayEventsCard.tsx                        (new)
  ├── PendingActionsCard.tsx                     (new)
  ├── ClientsLowSessionsCard.tsx                 (new)
  ├── InactiveClientsCard.tsx                    (new)
  └── DashboardSkeleton.tsx                      (new)
src/features/dashboard/hooks/
  ├── useDashboardKpis.ts                        (new)
  ├── useTodayEvents.ts                          (new)
  ├── usePendingActions.ts                       (new)
  ├── useClientsLowSessions.ts                   (new)
  └── useInactiveClients.ts                      (new)
src/App.tsx                                      (modify routing)
src/components/AppSidebar.tsx                    (add Dashboard item)
src/components/MobileNav.tsx                     (add Dashboard item)
```

---

### 2. Routing Changes

**App.tsx updates:**
- Add `/dashboard` route pointing to new Dashboard page
- Change `/` from `<Clients />` to `<Navigate to="/dashboard" replace />`
- Keep `/clients` for the clients listing page

**Sidebar/MobileNav:**
- Add "Dashboard" as first item → `/dashboard`
- Update "Clienti" → `/clients`

---

### 3. Component Specifications

#### DashboardHeader
- **Typography:** `text-[28px] font-semibold` for greeting, `text-base text-muted-foreground` for subtitle
- **Time-aware greeting:** Buongiorno/Buon pomeriggio/Buonasera
- **Quick Actions:** 
  - Primary: "Crea evento" (default Button variant)
  - Secondary: "Aggiungi cliente", "Registra pagamento" (outline variant)

#### KpiStrip (3 cards)
- **Number size:** `text-3xl font-bold tabular-nums`
- **Spacing:** `gap-2` between label/number/description
- **Icons:** `text-[hsl(var(--accent))]` for Ice Blue accent
- **Hover state:** `hover:shadow-md hover:-translate-y-[1px] transition-all duration-200`

#### TodayEventsCard
- **Accent bar:** `border-t-2 border-[hsl(var(--accent))]`
- **Compact empty state:** `py-6` instead of `py-12`, inline icon + text
- **Next event indicator:** Subtle highlight for events within 2 hours
- **Footer:** Always show "Vedi calendario completo →"

#### PendingActionsCard
- **Accent bar:** Same as above
- **Positive empty state:** "Tutto sotto controllo" / "Non ci sono azioni da gestire"
- **Fixed order:** Booking requests → Counter proposals → Payments

#### ClientsLowSessionsCard (NEW)
- **Accent bar:** `border-t-2 border-[hsl(var(--accent))]`
- **Query:** Aggregate sessions per client, filter remaining ≤ 2, order ASC
- **Display:** "Anna Verdi — 1 sessione rimasta"
- **Max 5 clients**

#### InactiveClientsCard (NEW)
- **Query:** Clients with last event > 30 days ago (excluding no-history)
- **Display:** "Mario Rossi — Ultimo evento: 34 giorni fa"
- **Max 5 clients**

---

### 4. Design Specifications

**Section Spacing:**
- `gap-10` (40px) between major sections
- `gap-6` (24px) inside cards

**Premium Card Styling:**
```css
.premium-card {
  @apply rounded-2xl shadow-sm bg-card p-6;
  @apply transition-all duration-200;
  @apply hover:shadow-md hover:-translate-y-[1px];
}
```

**Accent Bar (Ice Blue):**
```css
.accent-card {
  @apply border-t-2 border-[hsl(var(--accent))];
}
```

**Row Heights:**
- `min-h-[56px]` for list items
- Proper click areas

---

### 5. Data Hooks

**useDashboardKpis:**
- Events today count + next event time
- Total clients count
- Unpaid payments sum + count

**useTodayEvents:**
- Filter events for today
- Include client name, time, title
- Identify "next event" (within 2 hours)

**usePendingActions:**
- Booking requests: status = 'PENDING'
- Counter proposals: status = 'COUNTER_PROPOSED'
- Unpaid payments: orders with status != 'paid'
- Return in fixed order

**useClientsLowSessions:**
```sql
SELECT c.id, c.first_name, c.last_name, 
  SUM(p.total_sessions - p.consumed_sessions) as remaining
FROM clients c
JOIN coach_clients cc ON cc.client_id = c.id
JOIN package p ON p.coach_client_id = cc.id
GROUP BY c.id
HAVING SUM(p.total_sessions - p.consumed_sessions) <= 2
ORDER BY remaining ASC
LIMIT 5
```

**useInactiveClients:**
- Clients with at least 1 event in history
- Last event > 30 days ago
- Order by days since last event DESC

---

### 6. Layout Grid

```
Desktop (12-col grid):
┌──────────────────────────────────────────────┐
│ Header (greeting + quick actions)            │
├──────────────────────────────────────────────┤
│ KPI │ KPI │ KPI                              │ 
├─────────────────────────┬────────────────────┤
│ Eventi di Oggi (8 cols) │ Azioni (4 cols)    │
├─────────────┬───────────┴────────────────────┤
│ Low Sessions│ Inactive Clients (6 cols each) │
└─────────────┴────────────────────────────────┘

Mobile (vertical stack):
- Header
- KPI cards (stacked vertically)
- Today Events
- Pending Actions
- Low Sessions
- Inactive Clients
```

---

### 7. Implementation Order

1. Create data hooks (5 hooks)
2. Create Dashboard page with layout
3. Build DashboardHeader with typography + actions
4. Build KpiStrip with Ice Blue icons
5. Build TodayEventsCard with compact empty state
6. Build PendingActionsCard with positive empty state
7. Build ClientsLowSessionsCard
8. Build InactiveClientsCard
9. Add skeleton states to all cards
10. Update routing (App.tsx)
11. Update navigation (AppSidebar + MobileNav)
12. Add premium hover states + accent bars

---

## Technical Notes

- All copy in Italian
- Use existing Motion tokens from `motion-tokens.css`
- Ice Blue accent: `hsl(var(--accent))`
- Follow typography scale: 28px greeting, 17px card titles, 14px body
- Tabular numbers for KPI values
- Premium card interactions: subtle lift + shadow on hover
