

# Center-align empty state in TodayEventsCard

## Change

**`TodayEventsCard.tsx` line 78** — Add `items-center text-center` to the empty state container div, matching the pattern used in `InactiveClientsCard` and `ClientsLowSessionsCard`.

```
// Before
<div className="py-3 space-y-1.5">

// After
<div className="flex flex-col items-center text-center py-3 space-y-1.5">
```

No font size changes, no CTA removal. **1 file, 1 line changed.**

