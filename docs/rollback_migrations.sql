-- ================================================================
-- ROLLBACK SCRIPT (EMERGENCY USE ONLY)
-- ================================================================
-- Purpose: Remove changes made by planned_migrations.sql
-- CAUTION: This will drop new tables and indexes. Use only if migration
--          caused issues and you need to revert to previous state.
-- 
-- IMPORTANT: This does NOT drop new columns from existing tables
--            (too risky if data was written). Instead, you can:
--            - Leave columns in place (safest)
--            - Manually drop specific columns if confirmed empty
-- ================================================================

\echo 'WARNING: This script will remove tables, indexes, and policies created by planned_migrations.sql'
\echo 'Press Ctrl+C to cancel, or any key to continue...'
\prompt 'Continue? (yes/no): ' confirm

-- Exit if not confirmed
\if :{?confirm}
  \if :confirm != 'yes'
    \echo 'Rollback cancelled.'
    \quit
  \endif
\else
  \echo 'No confirmation received. Exiting.'
  \quit
\endif

-- ================================================================
-- SECTION 1: Drop New Tables (in reverse dependency order)
-- ================================================================

BEGIN;

\echo 'Dropping new tables...'

-- Drop package tables
DROP TABLE IF EXISTS package_consumptions CASCADE;
DROP TABLE IF EXISTS client_packages CASCADE;
DROP TABLE IF EXISTS package_types CASCADE;

-- Drop measurement types
DROP TABLE IF EXISTS measurement_types CASCADE;

-- Drop coach-client relationships
DROP TABLE IF EXISTS coach_clients CASCADE;

\echo 'New tables dropped.'

COMMIT;

-- ================================================================
-- SECTION 2: Drop New Indexes
-- ================================================================

BEGIN;

\echo 'Dropping new indexes...'

-- Client indexes
DROP INDEX IF EXISTS idx_clients_fiscal_code_unique;
DROP INDEX IF EXISTS idx_clients_coach_status;
DROP INDEX IF EXISTS idx_clients_coach_created;
DROP INDEX IF EXISTS idx_clients_status;

-- Plan template indexes
DROP INDEX IF EXISTS idx_plan_templates_not_deleted;
DROP INDEX IF EXISTS idx_plan_templates_coach_updated;

-- Event indexes
DROP INDEX IF EXISTS idx_events_coach_time;
DROP INDEX IF EXISTS idx_events_client_time;
DROP INDEX IF EXISTS idx_events_coach_status_time;

-- Booking request indexes
DROP INDEX IF EXISTS idx_booking_requests_coach_status;
DROP INDEX IF EXISTS idx_booking_requests_client;

-- Training session indexes
DROP INDEX IF EXISTS idx_training_sessions_client_started;
DROP INDEX IF EXISTS idx_training_sessions_plan_status;
DROP INDEX IF EXISTS idx_training_sessions_coach_time;
DROP INDEX IF EXISTS idx_training_sessions_event;

-- Exercise actuals indexes
DROP INDEX IF EXISTS idx_exercise_actuals_exercise_time;
DROP INDEX IF EXISTS idx_exercise_actuals_session_time;

-- Client plan indexes
DROP INDEX IF EXISTS idx_client_plans_client_status;
DROP INDEX IF EXISTS idx_client_plans_status_visible;
DROP INDEX IF EXISTS idx_client_plans_derived_from;

-- State log indexes
DROP INDEX IF EXISTS idx_client_state_logs_client_time;
DROP INDEX IF EXISTS idx_plan_state_logs_plan_time;
DROP INDEX IF EXISTS idx_plan_state_logs_client_time;

-- Measurement indexes
DROP INDEX IF EXISTS idx_measurements_client_date;

-- Activity indexes
DROP INDEX IF EXISTS idx_client_activities_client_time;

-- Availability indexes
DROP INDEX IF EXISTS idx_availability_windows_coach_active;
DROP INDEX IF EXISTS idx_availability_windows_oneoff;

\echo 'New indexes dropped.'

COMMIT;

-- ================================================================
-- SECTION 3: Drop Functions/Triggers for New Tables
-- ================================================================

BEGIN;

\echo 'Dropping triggers and functions for new tables...'

DROP TRIGGER IF EXISTS trigger_coach_clients_updated_at ON coach_clients;
DROP FUNCTION IF EXISTS update_coach_clients_updated_at();

DROP TRIGGER IF EXISTS trigger_package_types_updated_at ON package_types;
DROP FUNCTION IF EXISTS update_package_types_updated_at();

DROP TRIGGER IF EXISTS trigger_client_packages_updated_at ON client_packages;
DROP FUNCTION IF EXISTS update_client_packages_updated_at();

DROP TRIGGER IF EXISTS trigger_measurement_types_updated_at ON measurement_types;
DROP FUNCTION IF EXISTS update_measurement_types_updated_at();

\echo 'Triggers and functions dropped.'

COMMIT;

-- ================================================================
-- SECTION 4: Revert Autovacuum Settings
-- ================================================================

BEGIN;

\echo 'Reverting autovacuum settings to defaults...'

-- Reset to PostgreSQL defaults
ALTER TABLE training_sessions RESET (autovacuum_vacuum_scale_factor, autovacuum_analyze_scale_factor);
ALTER TABLE events RESET (autovacuum_vacuum_scale_factor, autovacuum_analyze_scale_factor, fillfactor);
ALTER TABLE clients RESET (autovacuum_vacuum_scale_factor);
ALTER TABLE client_plans RESET (autovacuum_vacuum_scale_factor, fillfactor);
ALTER TABLE booking_requests RESET (autovacuum_vacuum_scale_factor);

\echo 'Autovacuum settings reset.'

COMMIT;

-- ================================================================
-- SECTION 5: Optional - Drop New Columns (CAUTION)
-- ================================================================

\echo ''
\echo '================================================================'
\echo 'OPTIONAL: Drop new columns from existing tables'
\echo '================================================================'
\echo 'WARNING: Only do this if you are CERTAIN no data was written to these columns.'
\echo 'Uncommment the statements below and re-run if you want to drop new columns.'
\echo ''

-- Uncomment to drop new columns (ONLY if confirmed safe):

-- BEGIN;
-- 
-- \echo 'Dropping new columns from existing tables...'
-- 
-- -- Clients
-- ALTER TABLE clients DROP COLUMN IF EXISTS fiscal_code;
-- 
-- -- Plan templates
-- ALTER TABLE plan_templates DROP COLUMN IF EXISTS deleted_at;
-- 
-- -- Client plans
-- ALTER TABLE client_plans DROP COLUMN IF EXISTS objective;
-- ALTER TABLE client_plans DROP COLUMN IF EXISTS duration_weeks;
-- 
-- -- Booking settings
-- ALTER TABLE booking_settings DROP COLUMN IF EXISTS max_future_days;
-- ALTER TABLE booking_settings DROP COLUMN IF EXISTS cancel_policy_hours;
-- ALTER TABLE booking_settings DROP COLUMN IF EXISTS buffer_before_minutes;
-- ALTER TABLE booking_settings DROP COLUMN IF EXISTS buffer_after_minutes;
-- ALTER TABLE booking_settings DROP COLUMN IF EXISTS timezone;
-- 
-- -- Availability windows
-- ALTER TABLE availability_windows DROP COLUMN IF EXISTS type;
-- ALTER TABLE availability_windows DROP COLUMN IF EXISTS start_date;
-- ALTER TABLE availability_windows DROP COLUMN IF EXISTS end_date;
-- ALTER TABLE availability_windows DROP COLUMN IF EXISTS location;
-- ALTER TABLE availability_windows DROP COLUMN IF EXISTS capacity;
-- ALTER TABLE availability_windows DROP COLUMN IF EXISTS is_active;
-- 
-- \echo 'New columns dropped.'
-- 
-- COMMIT;

-- ================================================================
-- ROLLBACK COMPLETE
-- ================================================================

\echo ''
\echo '================================================================'
\echo 'ROLLBACK COMPLETE'
\echo '================================================================'
\echo 'New tables, indexes, and settings have been removed.'
\echo 'To drop new columns, uncomment Section 5 and re-run.'
\echo '================================================================'
