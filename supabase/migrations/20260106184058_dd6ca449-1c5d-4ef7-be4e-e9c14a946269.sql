-- Update check constraint for duration_months to allow 1, 2, 3, 6, 9, 12
ALTER TABLE package DROP CONSTRAINT check_duration_months;
ALTER TABLE package ADD CONSTRAINT check_duration_months 
  CHECK (duration_months = ANY (ARRAY[1, 2, 3, 6, 9, 12]));

-- Update check constraint for total_sessions to allow 1, 3, 5, 10, 15, 20
ALTER TABLE package DROP CONSTRAINT package_total_sessions_check;
ALTER TABLE package ADD CONSTRAINT package_total_sessions_check 
  CHECK (total_sessions = ANY (ARRAY[1, 3, 5, 10, 15, 20]) AND total_sessions > 0);