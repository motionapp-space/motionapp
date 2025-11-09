-- Add buffer_between_minutes to booking_settings
ALTER TABLE booking_settings 
ADD COLUMN IF NOT EXISTS buffer_between_minutes integer DEFAULT 0;

COMMENT ON COLUMN booking_settings.buffer_between_minutes IS 'Buffer time in minutes between consecutive slots (invisible to clients)';
