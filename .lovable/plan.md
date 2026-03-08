

# Motion Coach Dashboard — Final Implementation Plan

## Summary
Build a premium operational dashboard as the coach's homepage. All refinements incorporated, fully localized in Italian.

---

## Routing & Navigation

| Route | Component | Notes |
|-------|-----------|-------|
| `/dashboard` | Dashboard | Explicit dashboard route |
| `/` | Redirect | → `/dashboard` |
| `/clients` | Clients | Existing clients page |

**Sidebar Order:**
1. Dashboard (active only on `/dashboard`)
2. Clienti (active on `/clients/*`)
3. Calendario, Booking, Pagamenti, Biblioteca

---

## Visual Hierarchy

| Priority | Component | Grid |
|----------|-----------|------|
| 1 | Eventi di Oggi (hero) | 8 cols |
| 2 | Azioni in Sospeso | 4 cols |
| 3 | KPI Strip | 12 cols |
| 4 | Clienti con Poche Sessioni | 6 cols |
| 5 | Clienti Inattivi | 6 cols |
| 6 | Attività Recenti | 12 cols |

---

## Component Specifications

### Header
```
Buongiorno, Marco
Ecco cosa ti aspetta oggi
```
Quick actions: Aggiungi Cliente, Crea Evento, Registra Pagamento

### KPI Strip (3 cards)

**Eventi Oggi:**
- Value: count
- Sublabel: `Prossimo alle 10:30` OR `Nessun evento oggi` (if count = 0)

**Clienti:**
- Value: total
- Sublabel: `Clienti totali`

**Pagamenti da Ricevere:**
- Value: €X
- Sublabel: `N elementi non pagati`

### Eventi di Oggi (Hero Card)

**Next Event Indicator** (if event within 2 hours):
```
Prossimo evento
09:00 — Luca Rossi
```

**List:** Time | Client | Event Title (max 6)  
**Footer:** Always show `Vedi calendario completo →`

**Empty State:**
```
Icon: Calendar
Title: Nessun evento oggi
Subtitle: Goditi la giornata libera o pianifica qualcosa di nuovo
CTA: Aggiungi Evento
```

### Azioni in Sospeso

**Fixed Order:**
1. `N richieste di prenotazione da gestire`
2. `N controproposte in attesa di conferma`
3. `N pagamenti da registrare`

Max 4 items. Each clickable → navigates to relevant page.

### Clienti con Poche Sessioni

**Query Logic (correct aggregation):**
```sql
SELECT c.id, c.first_name, c.last_name,
  SUM(p.total_sessions - p.consumed_sessions) AS remaining
FROM clients c
JOIN coach_clients cc ON cc.client_id = c.id
JOIN package p ON p.coach_client_id = cc.id
WHERE cc.coach_id = auth.uid()
GROUP BY c.id, c.first_name, c.last_name
HAVING SUM(p.total_sessions - p.consumed_sessions) <= 2
ORDER BY remaining ASC
LIMIT 5
```

**Display:** `Anna Verdi — 1 sessione rimasta`  
**Actions:** Crea Pacchetto | Apri Cliente

### Clienti Inattivi

**Logic:** Clients with at least 1 historical event, where last event > 30 days ago.

**Display:** `Cliente — Ultimo evento: 34 giorni fa`  
**Actions:** Pianifica Evento | Apri Cliente  
**Max:** 5 clients

### Attività Recenti

**Filter for types:** workout_completed, payment_recorded, event_booked, client_added  
**Limit:** Max 6 quality items  
**Display:** Icon + descriptive message + timestamp

---

## Design Specs

**Spacing:** `gap-8` sections, `gap-6` inside cards, `min-h-[56px]` rows  
**Cards:** `rounded-2xl shadow-sm bg-card p-6`  
**Interactions:** `hover:bg-muted/50` rows, `transition-colors duration-200`

---

## Mobile Layout

**Vertical stack order:**
1. Header
2. KPI (vertical stack, NOT horizontal scroll)
3. Eventi di Oggi (max 4)
4. Azioni in Sospeso
5. Clienti con Poche Sessioni
6. Clienti Inattivi
7. Attività Recenti (max 3)

---

## Loading States

Each component gets dedicated skeleton:
- KPI: 3 rectangular skeletons
- Eventi: 4-6 row skeletons
- Side widgets: 3-5 small row skeletons

---

## File Structure

```
src/pages/Dashboard.tsx
src/features/dashboard/
├── components/
│   ├── DashboardHeader.tsx
│   ├── KpiStrip.tsx
│   ├── TodayEventsCard.tsx
│   ├── PendingActionsCard.tsx
│   ├── ClientsLowSessionsCard.tsx
│   ├── InactiveClientsCard.tsx
│   ├── RecentActivityCard.tsx
│   └── DashboardSkeleton.tsx
├── hooks/
│   ├── useTodayEvents.ts
│   ├── usePendingActions.ts
│   ├── useClientsLowSessions.ts
│   ├── useInactiveClients.ts
│   └── useRecentActivity.ts
```

---

## Implementation Steps

1. Create Dashboard page with layout grid
2. Update App.tsx routing (`/dashboard`, redirect `/`, add `/clients`)
3. Update sidebar navigation (both AppSidebar and MobileNav)
4. Implement data hooks with correct SQL aggregations
5. Build each component with skeleton states
6. Add responsive mobile layout
7. Polish interactions and empty states

