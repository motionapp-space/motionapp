

# Dashboard UX Polish — 5 Surgical Fixes

5 files, minimal edits. Incorporates both corrections: no `text-success`, no chevrons on event rows.

---

## Changes

### 1. `TodayEventsCard.tsx`
- **Accent bg**: `bg-accent/4` → `bg-accent/6`, `border-accent/12` → `border-accent/18`
- **Row style**: `rounded-xl px-4 py-3` → `rounded-lg px-3 py-2.5` (uniform pattern)
- **CTA label**: "Vedi calendario completo" → "Vai al calendario"
- **No chevron** on event rows (navigates to calendar, not drill-down)

### 2. `ActivityTrendCard.tsx`
- **Trend text**: `text-accent` → `text-muted-foreground` (both positive and negative directions use `text-muted-foreground`; icon stays as visual cue with same color)

### 3. `UpcomingEventsCard.tsx`
- **No chevron** on rows (same rationale as Today)
- Already has correct hover pattern ✓

### 4. `ClientsLowSessionsCard.tsx`
- **Row padding**: `py-2` → `py-2.5`
- **Add chevron**: yes — each row opens client detail (real drill-down)

### 5. `InactiveClientsCard.tsx`
- **Row padding**: `py-2` → `py-2.5`
- **Add chevron**: yes — each row opens client detail (real drill-down)

---

5 files, no layout or data changes.

