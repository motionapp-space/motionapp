

# Dashboard Cache Sync — Targeted Invalidation

## Critical Discovery

All dashboard queries append `userId` to their keys:
- `["dashboard", "todayEvents", userId]`
- `["dashboard", "pendingActions", userId]`
- etc.

This means `invalidateQueries({ queryKey: ["dashboard", "todayEvents"] })` will work correctly because React Query uses **prefix matching** by default. No issue — the plan's approach is valid as-is.

`["dashboardStats"]` **is actively used** in `useDashboardStats.ts`, so we keep `stats()` in the key factory.

## Implementation

### 2 new files

**`src/features/dashboard/lib/dashboardQueryKeys.ts`** — Key factory as specified in the plan.

**`src/features/dashboard/lib/invalidateDashboardQueries.ts`** — Targeted invalidation helper as specified.

### 8 mutation hook updates

Each gets imports + `await invalidateDashboardQueries(...)` appended in `onSuccess`, with the exact key sets from the plan:

| File | Keys to invalidate |
|---|---|
| `useMarkOrderPaid.ts` | pendingActions, revenueTrend, stats |
| `useRegisterPayment.ts` | pendingActions, revenueTrend, stats |
| `useResetPayment.ts` | pendingActions, revenueTrend, stats |
| `useCreateEvent.ts` | todayEvents, inactiveClients |
| `useCancelEvent.ts` | todayEvents, inactiveClients |
| `useBookingRequests.ts` (4 hooks) | pendingActions, todayEvents |
| `useUpdatePackage.ts` | clientsLowSessions |
| `usePackageActions.ts` (2 hooks) | clientsLowSessions |

### Notes
- `onSuccess` callbacks that aren't already `async` will be converted to `async`
- All existing logic (toasts, other invalidations, activity logging) preserved
- No blanket `["dashboard"]` invalidation used anywhere

