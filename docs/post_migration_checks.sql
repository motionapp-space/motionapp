-- ================================================================
-- POST-MIGRATION VERIFICATION CHECKS
-- ================================================================
-- Purpose: Verify that planned_migrations.sql executed successfully
-- Run after: planned_migrations.sql
-- Expected: All checks should return results confirming changes applied
-- ================================================================

\echo '================================================================'
\echo 'POST-MIGRATION VERIFICATION CHECKS'
\echo '================================================================'
\echo ''

-- ================================================================
-- CHECK 1: New Columns Exist
-- ================================================================
\echo '1. Checking new columns exist...'

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'clients' AND column_name = 'fiscal_code')
    OR (table_name = 'plan_templates' AND column_name = 'deleted_at')
    OR (table_name = 'client_plans' AND column_name IN ('objective', 'duration_weeks'))
    OR (table_name = 'booking_settings' AND column_name IN ('max_future_days', 'cancel_policy_hours', 'buffer_before_minutes', 'buffer_after_minutes', 'timezone'))
    OR (table_name = 'availability_windows' AND column_name IN ('type', 'start_date', 'end_date', 'location', 'capacity', 'is_active'))
  )
ORDER BY table_name, column_name;

\echo ''

-- ================================================================
-- CHECK 2: New Tables Exist
-- ================================================================
\echo '2. Checking new tables exist...'

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('coach_clients', 'package_types', 'client_packages', 'package_consumptions', 'measurement_types')
ORDER BY table_name;

\echo ''

-- ================================================================
-- CHECK 3: Indexes Created
-- ================================================================
\echo '3. Checking critical indexes exist...'

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_clients_fiscal_code_unique',
    'idx_events_coach_time',
    'idx_training_sessions_client_started',
    'idx_client_plans_client_status',
    'idx_availability_windows_coach_active',
    'idx_package_types_coach_active',
    'idx_measurement_types_code'
  )
ORDER BY tablename, indexname;

\echo ''

-- ================================================================
-- CHECK 4: RLS Policies on New Tables
-- ================================================================
\echo '4. Checking RLS enabled and policies exist on new tables...'

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('coach_clients', 'package_types', 'client_packages', 'package_consumptions', 'measurement_types')
ORDER BY tablename, policyname;

\echo ''

-- ================================================================
-- CHECK 5: Triggers for updated_at
-- ================================================================
\echo '5. Checking updated_at triggers exist...'

SELECT 
  event_object_schema,
  event_object_table,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('coach_clients', 'package_types', 'client_packages', 'measurement_types')
  AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table, trigger_name;

\echo ''

-- ================================================================
-- CHECK 6: Table Settings (Autovacuum)
-- ================================================================
\echo '6. Checking autovacuum tuning applied...'

SELECT 
  schemaname,
  tablename,
  reloptions
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('training_sessions', 'events', 'clients', 'client_plans', 'booking_requests')
  AND reloptions IS NOT NULL
ORDER BY tablename;

\echo ''

-- ================================================================
-- CHECK 7: Data Migration (coach_clients backfill)
-- ================================================================
\echo '7. Checking coach_clients backfill from clients table...'

SELECT 
  COUNT(*) as total_coach_client_relationships,
  COUNT(DISTINCT client_id) as unique_clients,
  COUNT(DISTINCT coach_id) as unique_coaches
FROM coach_clients;

\echo ''
\echo 'Sample coach_clients rows:'
SELECT 
  cc.id,
  cc.coach_id,
  cc.client_id,
  cc.role,
  cc.status,
  cc.started_at,
  c.first_name || ' ' || c.last_name as client_name
FROM coach_clients cc
JOIN clients c ON c.id = cc.client_id
LIMIT 5;

\echo ''

-- ================================================================
-- CHECK 8: Measurement Types Seeded
-- ================================================================
\echo '8. Checking measurement_types seeded...'

SELECT 
  code,
  name,
  unit,
  decimals,
  min_value,
  max_value
FROM measurement_types
ORDER BY code;

\echo ''

-- ================================================================
-- CHECK 9: Verify Indexes Are Used (EXPLAIN Analysis)
-- ================================================================
\echo '9. Sample query plan checks (index usage)...'

\echo 'Query 1: Events by coach and date range'
EXPLAIN (COSTS OFF)
SELECT id, title, start_at, end_at
FROM events
WHERE coach_id = '00000000-0000-0000-0000-000000000000'
  AND start_at >= '2025-01-01'
  AND start_at < '2025-02-01'
ORDER BY start_at;

\echo ''
\echo 'Query 2: Training sessions by client with started_at DESC'
EXPLAIN (COSTS OFF)
SELECT id, status, started_at
FROM training_sessions
WHERE client_id = '00000000-0000-0000-0000-000000000000'
ORDER BY started_at DESC NULLS LAST
LIMIT 10;

\echo ''
\echo 'Query 3: Client plans by client and status'
EXPLAIN (COSTS OFF)
SELECT id, name, status, updated_at
FROM client_plans
WHERE client_id = '00000000-0000-0000-0000-000000000000'
  AND status = 'IN_CORSO'
ORDER BY updated_at DESC;

\echo ''

-- ================================================================
-- CHECK 10: Foreign Key Constraints
-- ================================================================
\echo '10. Checking foreign key constraints on new tables...'

SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('coach_clients', 'package_types', 'client_packages', 'package_consumptions')
ORDER BY tc.table_name, kcu.column_name;

\echo ''

-- ================================================================
-- VERIFICATION COMPLETE
-- ================================================================
\echo '================================================================'
\echo 'VERIFICATION COMPLETE'
\echo '================================================================'
\echo 'Review results above. All checks should show expected objects.'
\echo 'If any are missing, re-run relevant section of planned_migrations.sql'
\echo '================================================================'
