

# Dashboard UX Polish — 9.8/10 Refinements

## 7 files to modify

### 1. `TodayEventsCard.tsx`
- **Remove `NextEventBanner`** component entirely (eliminates duplication)
- **Add event count to title**: `Eventi di oggi · {count}` when events exist
- **CTA only in empty state** (not in header when events exist) — per user's refinement #1
- **Improve text hierarchy** in event rows: time `text-white/70`, client name `text-white`, event type `text-white/60`
- **Compact row layout**: time + client on same line, event type below — `20:15  Test Test` / `Appuntamento`

### 2. `DashboardHeader.tsx`
- Keep as empty container (render nothing for now, preserve for future top actions)

### 3. `Dashboard.tsx`
- Remove `<DashboardHeader />` from layout (keep import commented or remove)
- Tighten gap between ActivityTrendCard and hero grid: wrap in a `space-y-5` sub-container

### 4. `ActivityTrendCard.tsx`
- **Stack title and stats vertically** for stronger number dominance:
  - Line 1: `Andamento attività` (`text-lg font-semibold`)
  - Line 2: amount at `text-3xl font-semibold` + `questo mese` + percent badge
- Increase XAxis tick opacity to `fillOpacity: 0.8`

### 5. `PendingActionsCard.tsx`
- Empty state copy: `Tutto sotto controllo` → `Nessuna azione in sospeso`
- Empty sublabel: `Non ci sono azioni da gestire` → `Tutto aggiornato`

### 6. `ClientsLowSessionsCard.tsx`
- Title: `Sessioni in esaurimento` → `Pacchetti in esaurimento`
- Empty state: `Nessun cliente con sessioni in esaurimento` → `Nessun cliente con pacchetti in esaurimento`
- Empty state padding: `py-4` → `py-3`

### 7. `InactiveClientsCard.tsx`
- Empty state padding: `py-4` → `py-3`

