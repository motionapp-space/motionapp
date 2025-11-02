# Database Schema Comparison Report

**Generated**: 2025-01-29  
**Purpose**: Compare current schema against target ER model and identify non-breaking alignment opportunities

---

## Executive Summary

The current database schema is generally well-structured and operational. This report identifies **additive-only** changes to align with the target model while maintaining full backward compatibility.

### Key Findings

✅ **No Breaking Changes Required**  
✅ **Performance Optimizations Available**: 15+ indexes, partitioning candidates  
✅ **New Feature Tables**: Package management, measurement types, coach-client relationships  
✅ **Schema Enhancements**: Soft deletes, denormalization, fiscal codes

---

## 1. Core Entity Comparison

### 1.1 CLIENT (✓ Exists as `clients`)

**Missing Columns:**
- `fiscal_code` TEXT UNIQUE (nullable) - for Italian tax code
- Consider: Better soft-delete pattern consistency

**Recommendation:**
```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fiscal_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_fiscal_code_unique 
  ON clients(fiscal_code) WHERE fiscal_code IS NOT NULL;
```

**Status**: Non-breaking addition ✅

---

### 1.2 COACH (✓ Exists as `coaches`)

**Current State**: Adequate for current needs  
**Status**: No changes required ✅

---

### 1.3 COACH_CLIENT (❌ Does Not Exist)

**Purpose**: Track coach-client relationships with role, status, and lifecycle  
**Current Pattern**: Direct `coach_id` FK on `clients` table  
**Gap**: Cannot model:
- Multiple coaches per client
- Relationship history (started_at, ended_at)
- Relationship status independent of client status
- Coach roles (primary, assistant, nutritionist)

**Recommendation**: Create new table (non-breaking)
```sql
CREATE TABLE IF NOT EXISTS coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'primary',
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Migration Strategy**:
1. Create table
2. Backfill from existing `clients.coach_id` relationships
3. Keep `clients.coach_id` for backward compatibility (do not drop)
4. Add indexes for queries

**Status**: New feature, non-breaking ✅

---

### 1.4 TRAINING_TEMPLATE (✓ Exists as `plan_templates`)

**Missing Columns:**
- `deleted_at` TIMESTAMPTZ (soft delete pattern)

**Current**: Has all core fields (id, coach_id, name, description, data, category, created_at, updated_at)

**Recommendation:**
```sql
ALTER TABLE plan_templates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_plan_templates_deleted_at 
  ON plan_templates(deleted_at) WHERE deleted_at IS NULL;
```

**Status**: Non-breaking addition ✅

---

### 1.5 TRAINING_PLAN (✓ Exists as `client_plans`)

**Current Fields**: id, client_id, coach_id, name, description, data, status, is_visible, locked_at, completed_at, deleted_at, version, created_at, updated_at, derived_from_template_id

**Missing from Target**:
- `objective` TEXT (plan goal/purpose)
- `duration_weeks` INTEGER

**Current Has But Target Doesn't Specify**:
- `is_visible` BOOLEAN (feature: hide plans from client)
- `locked_at` TIMESTAMPTZ (feature: prevent edits)
- `version` INTEGER (optimistic locking)

**Recommendation:**
```sql
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS duration_weeks INTEGER;
```

**Status**: Non-breaking additions ✅

---

### 1.6 PLAN_DAY (❌ Does Not Exist as Separate Table)

**Current Pattern**: Days stored as JSON in `client_plans.data` and `plan_templates.data`

**Target Model**: Separate `plan_days` table with:
- day_id PK
- plan_id FK
- day_order INTEGER
- title TEXT
- created_at, updated_at

**Gap Analysis**:
- Current JSON structure is flexible but makes querying specific days difficult
- Cannot easily reference a specific day from calendar events or training sessions
- Day-level history/auditing is complex

**Recommendation**: **DO NOT MIGRATE YET** - This is a major structural change that requires:
1. Data migration from JSON → relational
2. Code changes across the app (plan editor, day picker, session flows)
3. Dual-write period for safety
4. Careful rollout with feature flags

Instead:
- Document as **future enhancement**
- Keep current JSON-based approach working
- Add indexes/optimization to JSON queries if needed

**Status**: Deferred - too breaking ⚠️

---

### 1.7 CALENDAR_APPOINTMENT (✓ Exists as `events`)

**Current Fields**: id, coach_id, client_id, title, start_at, end_at, location, notes, is_all_day, reminder_offset_minutes, color, recurrence_rule, linked_plan_id, linked_day_id, session_status, created_at, updated_at

**Target Fields**: appointment_id, client_id, title, start_at, end_at, status, notes, linked_plan_id, linked_day_id

**Analysis**:
- Current has MORE features than target (color, reminders, recurrence, all-day, location)
- Current uses `session_status` where target uses `status`
- Both have linked_plan_id and linked_day_id (TEXT) ✅

**Recommendation**: No changes needed - current is superset of target ✅

**Status**: Aligned ✅

---

### 1.8 TRAINING_SESSION (✓ Exists as `training_sessions`)

**Current Fields**: id, client_id, coach_id, status, plan_id, day_id, event_id, scheduled_at, started_at, ended_at, notes, created_at, updated_at

**Target Fields**: session_id, client_id, day_id FK, appointment_id FK, plan_id (denorm), status, scheduled_at, started_at, ended_at, notes, created_at, updated_at

**Analysis**:
- ✅ Has plan_id (denormalized for query optimization)
- ✅ Has day_id (TEXT reference into JSON structure)
- ✅ Has event_id (maps to appointment_id)
- ✅ Has coach_id (additional denorm)
- ✅ All temporal fields present

**Recommendation**: Schema is aligned ✅

**Status**: No changes needed ✅

---

## 2. Package Management Tables (❌ Do Not Exist)

### 2.1 PACKAGE_TYPE

**Purpose**: Define package offerings (1, 5, 10, 20 session bundles)

**Recommendation**: Create new table
```sql
CREATE TABLE IF NOT EXISTS package_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_sessions INTEGER NOT NULL CHECK (total_sessions IN (1, 5, 10, 20)),
  duration_days INTEGER,
  price_cents BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Status**: New feature table ✅

---

### 2.2 CLIENT_PACKAGE

**Purpose**: Track purchased packages per client

**Recommendation**: Create new table
```sql
CREATE TABLE IF NOT EXISTS client_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  package_type_id UUID NOT NULL REFERENCES package_types(id),
  status TEXT NOT NULL DEFAULT 'active',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  sessions_total INTEGER NOT NULL,
  sessions_remaining INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Status**: New feature table ✅

---

### 2.3 PACKAGE_CONSUMPTION

**Purpose**: Track session consumption from packages

**Recommendation**: Create new table
```sql
CREATE TABLE IF NOT EXISTS package_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_package_id UUID NOT NULL REFERENCES client_packages(id) ON DELETE CASCADE,
  session_id UUID UNIQUE REFERENCES training_sessions(id) ON DELETE SET NULL,
  units INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Status**: New feature table ✅

---

## 3. Booking Configuration Tables

### 3.1 BOOKING_SETTING (✓ Exists as `booking_settings`)

**Current Fields**: id, coach_id, enabled, slot_duration_minutes, min_advance_notice_hours, approval_mode, created_at, updated_at

**Target Fields**: booking_setting_id, coach_id, slot_minutes, lead_time_hours, max_future_days, cancel_policy_hours, buffer_before_minutes, buffer_after_minutes, timezone, auto_approve

**Missing Columns:**
- `max_future_days` INTEGER (how far ahead clients can book)
- `cancel_policy_hours` INTEGER (cancellation deadline)
- `buffer_before_minutes` INTEGER (prep time before session)
- `buffer_after_minutes` INTEGER (cleanup time after session)
- `timezone` TEXT (coach's timezone, e.g., 'Europe/Rome')

**Recommendation:**
```sql
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS max_future_days INTEGER DEFAULT 90;
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS cancel_policy_hours INTEGER DEFAULT 24;
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS buffer_before_minutes INTEGER DEFAULT 0;
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS buffer_after_minutes INTEGER DEFAULT 0;
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Rome';
```

**Status**: Non-breaking additions ✅

---

### 3.2 AVAILABILITY_WINDOW (✓ Exists as `availability_windows`)

**Current Fields**: id, coach_id, day_of_week, start_time, end_time, created_at

**Target Fields**: availability_id, coach_id, type (weekly_recurring | one_off), weekday INT, start_time_local, end_time_local, start_date, end_date, location, capacity, is_active

**Missing Columns:**
- `type` TEXT (discriminate between recurring weekly vs one-off date range)
- `start_date` DATE (for one-off windows)
- `end_date` DATE (for one-off windows)
- `location` TEXT (where session happens)
- `capacity` INTEGER (how many clients can book same slot)
- `is_active` BOOLEAN (enable/disable without deleting)

**Recommendation:**
```sql
ALTER TABLE availability_windows ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'weekly_recurring' CHECK (type IN ('weekly_recurring', 'one_off'));
ALTER TABLE availability_windows ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE availability_windows ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE availability_windows ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE availability_windows ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1;
ALTER TABLE availability_windows ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

**Status**: Non-breaking additions ✅

---

### 3.3 AVAILABILITY_EXCEPTION (⚠️ Partial - `out_of_office_blocks`)

**Current Table**: `out_of_office_blocks`
- Fields: id, coach_id, start_at, end_at, reason, is_recurring, recurrence_rule

**Target Table**: `availability_exceptions`
- Fields: exception_id, coach_id, date, start_time_local, end_time_local, reason, is_blocking

**Analysis**:
- Current uses TIMESTAMPTZ (full datetime), target uses DATE + TIME split
- Current supports recurrence, target doesn't mention it
- Target has `is_blocking` (true = block time, false = add extra time)

**Recommendation**: Keep `out_of_office_blocks` as-is, optionally create `availability_exceptions` as an additional pattern if needed for simpler day-level blocks

**Status**: Current table sufficient, no changes ✅

---

## 4. Measurement System Tables

### 4.1 MEASUREMENT_TYPE (❌ Does Not Exist)

**Current Pattern**: `measurements` table has columns for specific measurements (weight_kg, height_cm, bmi, body_fat_pct, etc.)

**Target Pattern**: Generic `measurement_types` + `client_measurements` for extensibility

**Recommendation**: Create new table
```sql
CREATE TABLE IF NOT EXISTS measurement_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit TEXT,
  decimals INTEGER DEFAULT 1,
  min_value NUMERIC,
  max_value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed basic types
INSERT INTO measurement_types (code, name, unit, decimals, min_value, max_value) VALUES
  ('WEIGHT', 'Peso', 'kg', 1, 20, 300),
  ('HEIGHT', 'Altezza', 'cm', 0, 50, 250),
  ('BMI', 'BMI', '', 1, 10, 60),
  ('BODY_FAT', 'Massa grassa', '%', 1, 1, 70),
  ('LEAN_MASS', 'Massa magra', 'kg', 1, 10, 150),
  ('WAIST', 'Girovita', 'cm', 0, 30, 200),
  ('HIP', 'Fianchi', 'cm', 0, 30, 200),
  ('CHEST', 'Torace', 'cm', 0, 30, 200),
  ('ARM', 'Braccio', 'cm', 0, 10, 80),
  ('THIGH', 'Coscia', 'cm', 0, 20, 120)
ON CONFLICT (code) DO NOTHING;
```

**Status**: New feature table ✅

---

### 4.2 CLIENT_MEASUREMENT (⚠️ Exists as `measurements` but different structure)

**Current**: `measurements` table with explicit columns per measurement type  
**Target**: Generic `client_measurements` table with measurement_type_id FK

**Gap**: Current structure is simpler but less flexible

**Recommendation**: **Keep current `measurements` table** for backward compatibility. Optionally add new `client_measurements` table for future extensibility, but don't migrate existing data yet.

**Status**: Keep as-is, defer refactor ⚠️

---

## 5. Performance & Operational Improvements

### 5.1 Indexing Strategy

**Critical Missing Indexes (Add Immediately):**

```sql
-- Calendar queries (coach viewing their schedule)
CREATE INDEX IF NOT EXISTS idx_events_coach_time ON events(coach_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_events_client_time ON events(client_id, start_at DESC);

-- Booking requests (pending queue)
CREATE INDEX IF NOT EXISTS idx_booking_requests_coach_status ON booking_requests(coach_id, status, requested_start_at);

-- Sessions (history, stats)
CREATE INDEX IF NOT EXISTS idx_training_sessions_client_started ON training_sessions(client_id, started_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_training_sessions_plan_status ON training_sessions(plan_id, status) WHERE plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_time ON training_sessions(coach_id, started_at DESC NULLS LAST);

-- Exercise actuals (history lookup)
CREATE INDEX IF NOT EXISTS idx_exercise_actuals_exercise_time ON exercise_actuals(exercise_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_actuals_session ON exercise_actuals(session_id, timestamp);

-- Client plans (active plan lookup)
CREATE INDEX IF NOT EXISTS idx_client_plans_client_status ON client_plans(client_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_plans_status_visible ON client_plans(status, is_visible) WHERE deleted_at IS NULL;

-- Client queries
CREATE INDEX IF NOT EXISTS idx_clients_coach_status ON clients(coach_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_coach_created ON clients(coach_id, created_at DESC);

-- State logs (audit/history)
CREATE INDEX IF NOT EXISTS idx_client_state_logs_client_time ON client_state_logs(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_state_logs_plan_time ON plan_state_logs(plan_id, created_at DESC);

-- Measurements (trend charts)
CREATE INDEX IF NOT EXISTS idx_measurements_client_date ON measurements(client_id, date DESC);

-- Availability (booking slot generation)
CREATE INDEX IF NOT EXISTS idx_availability_windows_coach_active ON availability_windows(coach_id, is_active) WHERE is_active = true;
```

**Optional Performance Indexes:**

```sql
-- Full-text search (if needed)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_clients_email_trgm ON clients USING gin(email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON clients USING gin((first_name || ' ' || last_name) gin_trgm_ops);
```

---

### 5.2 Partitioning Strategy (Time-Series Tables)

**Candidates for Partitioning:**

1. **events** (by start_at)
2. **training_sessions** (by started_at)
3. **exercise_actuals** (by timestamp)
4. **measurements** (by date)
5. **client_state_logs** / **plan_state_logs** (by created_at)

**Implementation Example (events):**

```sql
-- Convert events to partitioned table
-- WARNING: Requires downtime or online migration strategy
CREATE TABLE events_partitioned (LIKE events INCLUDING ALL) PARTITION BY RANGE (start_at);

-- Create partitions (current + next 3 months)
CREATE TABLE events_2025_01 PARTITION OF events_partitioned FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE events_2025_02 PARTITION OF events_partitioned FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- etc...

-- Migrate data (requires careful planning)
-- INSERT INTO events_partitioned SELECT * FROM events;

-- Swap tables (requires pg_repack or similar tool for zero-downtime)
```

**Recommendation**: **Defer partitioning** until data volume justifies complexity (e.g., >1M rows, query slowdowns). Current indexes should suffice for typical workloads.

**Status**: Document for future ⏸️

---

### 5.3 Autovacuum Tuning

**High-Churn Tables** (frequent updates/deletes):

```sql
-- training_sessions (status changes, notes updates)
ALTER TABLE training_sessions SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- events (reschedules, cancellations)
ALTER TABLE events SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  fillfactor = 85
);

-- clients (status changes, updates)
ALTER TABLE clients SET (
  autovacuum_vacuum_scale_factor = 0.05
);

-- client_plans (frequent saves in editor)
ALTER TABLE client_plans SET (
  autovacuum_vacuum_scale_factor = 0.05,
  fillfactor = 85
);
```

**Status**: Apply immediately ✅

---

### 5.4 UTC Timestamp Verification

**Verify all timestamp columns are `TIMESTAMPTZ`:**

```sql
-- Audit query
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type LIKE '%time%'
  AND data_type != 'timestamp with time zone'
ORDER BY table_name, column_name;
```

**Expected Result**: Only `availability_windows.start_time` and `end_time` should be `time` (local time of day), all others should be `timestamptz`.

**Status**: Verify and document ✅

---

### 5.5 UUID Consistency

**Current State**: All tables use UUID primary keys ✅

**Recommendation**: Continue using `gen_random_uuid()` for new tables. No changes needed.

**Status**: Aligned ✅

---

## 6. Summary of Recommended Actions

### Priority 1 (Immediate - Performance & Safety)

1. ✅ Add missing indexes (Section 5.1 - Critical)
2. ✅ Add autovacuum tuning (Section 5.3)
3. ✅ Verify UTC timestamp usage (Section 5.4)

### Priority 2 (Short-Term - Schema Alignment)

1. ✅ Add `clients.fiscal_code` column + unique index (Section 1.1)
2. ✅ Add `plan_templates.deleted_at` column (Section 1.4)
3. ✅ Add `client_plans.objective` and `duration_weeks` columns (Section 1.5)
4. ✅ Extend `booking_settings` with missing columns (Section 3.1)
5. ✅ Extend `availability_windows` with missing columns (Section 3.2)

### Priority 3 (Medium-Term - New Features)

1. ✅ Create `coach_clients` relationship table (Section 1.3)
2. ✅ Create package management tables (Section 2)
3. ✅ Create `measurement_types` table (Section 4.1)

### Deferred (Future Consideration)

1. ⏸️ Partitioning for time-series tables (Section 5.2)
2. ⏸️ Migrate to `plan_days` relational table (Section 1.6)
3. ⏸️ Migrate to generic `client_measurements` structure (Section 4.2)

---

## 7. Risk Assessment

**Breaking Changes**: NONE ✅  
**Data Loss Risk**: NONE (all additive) ✅  
**Rollback Complexity**: LOW (can drop new objects) ✅  
**Testing Required**: Unit + Integration (see planned_migrations.sql) ⚠️  
**Estimated Downtime**: ZERO (online migrations) ✅

---

## 8. Next Steps

1. Review this report with stakeholders
2. Execute `planned_migrations.sql` in staging environment
3. Run `post_migration_checks.sql` to verify
4. Monitor performance and query plans
5. Execute in production during low-traffic window
6. Update ORM/API code to leverage new columns/tables (backward compatible)

---

**Report End**
