

# Fix: Hide In-Progress Autonomous Sessions from Coach View

## Problem

The coach currently sees sessions that clients are recording autonomously (source = `autonomous`, status = `in_progress`). This violates the expected behavior where:

> **Autonomous sessions should only appear to the coach after the client has completed and saved them.**

This affects two places:
1. **Session History Tab** (`SessionHistoryTab.tsx`) — shows the in-progress autonomous session in the "Autonome" tab
2. **Sticky Session Bar** (`StickySessionBar.tsx`) — shows "Sessione in corso" for autonomous sessions

---

## Solution

Apply a filter in the API layer to exclude autonomous sessions that are still in progress when the coach queries for sessions.

---

## Phase 1: Fix `listSessions()` in `sessions.api.ts`

### Current Code (line ~45)
```typescript
const { data, error } = await query;
```

### Updated Logic

After fetching, filter out `autonomous` + `in_progress` sessions:

```typescript
const { data, error } = await query;
if (error) throw error;

// Filter out autonomous sessions that are still in progress
// Coach should only see autonomous sessions after they're completed
const filteredData = (data || []).filter((session: any) => {
  const isAutonomousInProgress = 
    session.source === 'autonomous' && session.status === 'in_progress';
  return !isAutonomousInProgress;
});
```

Then use `filteredData` instead of `data` in the return mapping.

---

## Phase 2: Fix `getActiveSession()` in `sessions.api.ts`

### Current Query (lines 157-165)
```typescript
const { data, error } = await supabase
  .from("training_sessions")
  .select("*")
  .in("coach_client_id", coachClients.map(cc => cc.id))
  .eq("status", "in_progress")
  .gte("started_at", twelveHoursAgo.toISOString())
  .order("started_at", { ascending: false })
  .limit(1)
  .maybeSingle();
```

### Updated Query

Add filter to only show `with_coach` sessions in the sticky bar:

```typescript
const { data, error } = await supabase
  .from("training_sessions")
  .select("*")
  .in("coach_client_id", coachClients.map(cc => cc.id))
  .eq("status", "in_progress")
  .eq("source", "with_coach")  // ← NEW: Only coach-initiated sessions
  .gte("started_at", twelveHoursAgo.toISOString())
  .order("started_at", { ascending: false })
  .limit(1)
  .maybeSingle();
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/features/sessions/api/sessions.api.ts` | Filter `listSessions()` to exclude autonomous + in_progress |
| `src/features/sessions/api/sessions.api.ts` | Add `.eq("source", "with_coach")` to `getActiveSession()` |

---

## Expected Behavior After Fix

| Scenario | Coach Sees |
|----------|------------|
| Client starts autonomous workout | ❌ Not visible |
| Client finishes autonomous workout | ✅ Visible in "Autonome" tab |
| Coach starts session with client | ✅ Visible + sticky bar |
| Coach finishes session | ✅ Visible in "Con PT" tab |

---

## No RLS Changes Needed

This is a presentation-layer filter, not a security restriction. The coach technically has access to see these sessions (for debugging, support), but the UI should not display them until completed.

---

## Testing Checklist

- [ ] Client starts autonomous workout → coach does NOT see sticky bar
- [ ] Client starts autonomous workout → coach does NOT see it in "Autonome" tab
- [ ] Client completes autonomous workout → coach sees it in "Autonome" tab
- [ ] Coach starts session → sticky bar appears, session visible in history
- [ ] Existing completed autonomous sessions still visible to coach

