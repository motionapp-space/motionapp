# 📦 Session Packages Management System

Complete, production-ready module for managing training session packages with automatic calendar integration, credit tracking, and audit trails.

## 🎯 Overview

This system manages **Session Packages** assigned by coaches to clients. Each package represents a block of paid sessions with:
- **Credit tracking** (total, consumed, on-hold, available)
- **Payment management** (unpaid, partial, paid, refunded)
- **Expiration rules** (auto-suspend when expired)
- **Calendar integration** (automatic credit consumption based on appointment status)
- **Complete audit trail** (all mutations logged in ledger)

## 🗄️ Database Schema

### Core Tables

**`package`** - Main package table
- `package_id` (UUID, PK)
- `client_id` (UUID, FK → clients)
- `coach_id` (UUID, FK → coaches)
- `name` (TEXT) - e.g. "10 lezioni individuali"
- `total_sessions` (INT) - 1, 5, 10, or 20
- `consumed_sessions` (INT) - Sessions consumed
- `on_hold_sessions` (INT) - Sessions reserved
- `price_total_cents` (INT) - Total price in cents
- `currency_code` (TEXT) - Default 'EUR'
- `price_source` (TEXT) - 'settings' | 'custom'
- `usage_status` (ENUM) - 'active' | 'completed' | 'suspended' | 'archived'
- `payment_status` (ENUM) - 'unpaid' | 'partial' | 'paid' | 'refunded'
- `duration_months` (INT) - 1, 3, 6, or 12
- `expires_at` (TIMESTAMPTZ) - Auto-calculated from created_at + duration_months
- `is_single_technical` (BOOLEAN) - Auto-created 1-session package
- `notes_internal` (TEXT) - Coach-only notes
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Constraints:**
- One active package per client (`UNIQUE INDEX` on client_id where usage_status='active')
- Auto-complete when consumed_sessions = total_sessions (trigger)
- Auto-suspend when expires_at reached (trigger)

**`package_ledger`** - Audit trail for all mutations
- `ledger_id` (UUID, PK)
- `package_id` (UUID, FK)
- `calendar_event_id` (UUID, FK - optional)
- `type` (ENUM) - 'HOLD_CREATE' | 'HOLD_RELEASE' | 'CONSUME' | 'CORRECTION' | 'PRICE_UPDATE'
- `reason` (ENUM) - 'CONFIRM' | 'CANCEL_GT_24H' | 'CANCEL_LT_24H' | 'COMPLETE' | 'ADMIN_CORRECTION'
- `delta_consumed` (INT) - Change in consumed_sessions
- `delta_hold` (INT) - Change in on_hold_sessions
- `note` (TEXT)
- `created_by` (UUID)
- `created_at` (TIMESTAMPTZ)

**Constraints:**
- Idempotent: `UNIQUE(package_id, calendar_event_id, type)`

**`package_settings`** - Coach defaults
- `settings_id` (UUID, PK)
- `coach_id` (UUID, FK)
- `sessions_1_price` (INT) - Default price for 1-session package (cents)
- `sessions_5_price` (INT)
- `sessions_10_price` (INT)
- `sessions_20_price` (INT)
- `sessions_1_duration` (INT) - Default duration in months (1, 3, 6, 12)
- `sessions_5_duration` (INT)
- `sessions_10_duration` (INT)
- `sessions_20_duration` (INT)
- `currency_code` (TEXT) - Default 'EUR'
- `lock_window_hours` (INT) - Default 12 (for late cancellation policy)

## 🔁 Business Logic

### Credit Invariants

```typescript
remaining = total_sessions - consumed_sessions
available = total_sessions - consumed_sessions - on_hold_sessions

// MUST ALWAYS BE TRUE:
available >= 0  // Enforced by DB trigger
```

### State Machines

**Usage Axis:**
- `active` → `completed` (auto, when consumed = total)
- `active` ↔ `suspended` (manual toggle or auto on expiration)
- `completed` → `archived` (manual, only if on_hold = 0)

**Payment Axis:**
- Independent from usage
- Manual state changes only

### Calendar Integration

| Event Status | Δ Hold | Δ Consumed | Ledger Type | Reason |
|-------------|---------|-----------|-------------|--------|
| Confirmed | +1 | 0 | `HOLD_CREATE` | `CONFIRM` |
| Completed | -1 | +1 | `CONSUME` | `COMPLETE` |
| Canceled (>24h) | -1 | 0 | `HOLD_RELEASE` | `CANCEL_GT_24H` |
| Canceled (<24h) | -1 | +1 | `CONSUME` | `CANCEL_LT_24H` |

**Lock Window:** Configurable per coach (default 12h). Late cancellations consume credit.

### Auto 1-Session Package

When confirming an event for a client with **no active package**:
1. Auto-create 1-session package
2. Use settings.sessions_1_price and sessions_1_duration
3. Mark as `is_single_technical = true`
4. Set name: "1 lezione individuale (automatico)"

## 📁 File Structure

```
src/features/packages/
├── api/
│   ├── packages.api.ts            # CRUD for packages
│   ├── ledger.api.ts               # Ledger operations
│   └── calendar-integration.api.ts # Calendar-package sync
├── components/
│   ├── PackageTab.tsx              # Main UI (in client detail)
│   ├── PackageCard.tsx             # Individual package display
│   ├── PackageDialog.tsx           # Create package form
│   ├── PackageStatsBar.tsx         # KPI display
│   └── PackageEmptyState.tsx       # First-time UX
├── hooks/
│   ├── useClientPackages.ts        # Fetch client packages
│   ├── usePackage.ts               # Fetch single package
│   ├── usePackageSettings.ts       # Coach defaults
│   ├── useCreatePackage.ts         # Create mutation
│   ├── useUpdatePackage.ts         # Update mutation
│   ├── usePackageActions.ts        # Archive, suspend, duplicate
│   ├── usePackageLedger.ts         # Fetch ledger entries
│   └── useEventPackageIntegration.ts # Calendar event hooks
├── utils/
│   └── kpi.ts                      # KPI calculations, formatting
├── types.ts                        # TypeScript definitions
└── README.md                       # This file
```

## 🧪 Automated Tests

Location: `src/features/packages/__tests__/package-integration.test.ts`

**Coverage:**
- ✅ Credit invariants (remaining, available)
- ✅ Auto-completion logic
- ✅ Hold/consume transitions for all event statuses
- ✅ Late vs early cancellation penalties
- ✅ Expiration detection and auto-suspend
- ✅ Duration calculation
- ✅ Price per session calculation
- ✅ Auto 1-session package creation

Run tests:
```bash
npm test src/features/packages
```

## 🎨 UI Components

### PackageTab
Main container shown in client detail page under "Pacchetti" tab.

**Features:**
- Shows active package with full details
- Displays KPIs (remaining, on-hold, consumed, available)
- Progress bar for completion
- Payment and usage status badges
- Actions: Modify, Suspend/Resume, Archive, Duplicate
- Historical view of completed/archived packages
- Empty state with call-to-action

### PackageDialog
Form for creating new packages.

**Auto-fill Behavior:**
- Select sessions (1, 5, 10, 20)
- Auto-suggest package name
- Prefill price from coach settings (editable)
- Prefill duration from coach settings (editable)
- Calculate expiration date preview
- Optional: payment method, notes

### PackageCard
Individual package display with:
- Name, creation/expiration dates
- Status badges (usage + payment)
- Stats bar (4 KPIs)
- Progress bar
- Pricing info (total + per-session)
- Alert for special conditions (expired, unpaid, on-hold)
- Actions dropdown

## 🔌 API Usage

### Create Package
```typescript
import { useCreatePackage } from '@/features/packages/hooks/useCreatePackage';

const createMutation = useCreatePackage();

createMutation.mutate({
  client_id: "...",
  name: "10 lezioni individuali",
  total_sessions: 10,
  price_total_cents: 50000,  // €500 (optional, uses settings default)
  duration_months: 6,         // optional, uses settings default
  payment_status: 'unpaid',
  notes_internal: "Promo -10%",
});
```

### Calendar Integration
```typescript
import { 
  useConfirmEventWithPackage,
  useCompleteEventWithPackage,
  useCancelEventWithPackage 
} from '@/features/packages/hooks/useEventPackageIntegration';

// On event confirm
const confirmMutation = useConfirmEventWithPackage();
confirmMutation.mutate({
  eventId: "...",
  clientId: "...",
  startAt: "2025-01-15T10:00:00Z"
});

// On event complete
const completeMutation = useCompleteEventWithPackage();
completeMutation.mutate({
  eventId: "...",
  packageId: "..."  // optional, auto-finds from ledger
});

// On event cancel
const cancelMutation = useCancelEventWithPackage();
cancelMutation.mutate({
  eventId: "...",
  packageId: "...",  // optional
  startAt: "2025-01-15T10:00:00Z"  // needed for penalty logic
});
```

### Ledger Queries
```typescript
import { usePackageLedger } from '@/features/packages/hooks/usePackageLedger';

const { data: ledger } = usePackageLedger(packageId);

// ledger: LedgerEntryWithEvent[] with event title, date, and metadata
```

## 🔐 Security

### Row-Level Security (RLS)
All tables have RLS enabled with policies:
- Coaches can only see/modify their own packages
- Coaches can only see/modify packages for their clients
- Ledger entries read-only (except manual corrections)

### Data Integrity
- Database triggers enforce invariants
- Unique constraints prevent duplicate ledger entries
- Check constraints on valid values (sessions, duration)

## 🚀 Migration & Deployment

### Initial Setup
1. Run migration (already applied):
   - Adds `duration_months` field
   - Creates expiration check trigger
   - Adds `PRICE_UPDATE` ledger type
   - Sets up default durations in settings

2. Update coach settings:
   ```typescript
   import { useUpdatePackageSettings } from '@/features/packages/hooks/usePackageSettings';
   
   updateSettings.mutate({
     sessions_1_price: 5000,      // €50
     sessions_5_price: 22500,     // €225
     sessions_10_price: 40000,    // €400
     sessions_20_price: 70000,    // €700
     sessions_1_duration: 1,      // 1 month
     sessions_5_duration: 3,      // 3 months
     sessions_10_duration: 6,     // 6 months
     sessions_20_duration: 12,    // 12 months
     lock_window_hours: 24,       // 24h cancellation policy
   });
   ```

3. No data migration needed - existing packages get default duration (3 months)

## 📊 KPI Calculations

```typescript
import { calculatePackageKPI } from '@/features/packages/utils/kpi';

const kpi = calculatePackageKPI(package);
// Returns:
// {
//   remaining: number;      // total - consumed
//   available: number;      // total - consumed - on_hold
//   consumed: number;
//   on_hold: number;
//   total: number;
//   price_per_session: number | null;
// }
```

## ⚠️ Important Notes

### Immutability Rules
- `total_sessions`: Immutable after creation
- `duration_months`: Immutable after creation
- `expires_at`: Can be edited but recalculated on creation from duration_months
- `price_total_cents`: Editable anytime (logs PRICE_UPDATE in ledger)

### Expiration Behavior
- Packages auto-suspend when `expires_at` reached (trigger on UPDATE)
- Suspended packages block new holds but allow release/consume of existing holds
- Manual reactivation possible

### Archive Requirements
- Can only archive if `on_hold_sessions = 0`
- Error thrown otherwise with helpful message

### Price Editing
- Any price change after creation marks `price_source = 'custom'`
- Creates ledger entry with `type = 'PRICE_UPDATE'`
- Shown with badge in UI

## 🎯 Acceptance Criteria (✅ Complete)

- [x] One active package per client
- [x] Usage and payment axes independent
- [x] Hold logic correct and idempotent
- [x] Defaults from settings; editable on create
- [x] Price editable anytime; changes audited
- [x] Duration immutable after creation
- [x] Expired packages auto-suspended
- [x] Full audit trail
- [x] Automated tests passing
- [x] UI conforms to brand design
- [x] Mobile-first responsive
- [x] Calendar integration complete
- [x] Auto 1-session package creation

## 🔧 Troubleshooting

### Issue: Package not auto-completing
**Check:** Database trigger `check_package_invariants` is active
**Fix:** Re-run migration to recreate trigger

### Issue: Expired package still accepting holds
**Check:** Expiration trigger `trigger_check_package_expiration` is active
**Fix:** Re-run migration to recreate trigger

### Issue: Duplicate ledger entries
**Check:** Unique constraint on `(package_id, calendar_event_id, type)`
**Fix:** Already in place; API handles gracefully with idempotency

### Issue: Available sessions going negative
**Check:** Trigger `check_package_invariants` should block updates
**Fix:** Manual correction via `createCorrection` API

## 📝 Future Enhancements (Out of Scope)

- [ ] Multi-currency support beyond EUR
- [ ] Package templates/presets
- [ ] Bulk operations
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Client portal access
- [ ] Payment gateway integration
- [ ] Recurring packages

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-09  
**Maintainer:** PT App Development Team
