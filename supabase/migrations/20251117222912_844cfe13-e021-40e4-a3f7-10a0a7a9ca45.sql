-- Add is_all_day field to out_of_office_blocks table
ALTER TABLE out_of_office_blocks 
ADD COLUMN is_all_day BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN out_of_office_blocks.is_all_day IS 'Indicates if the absence period covers the entire day(s) without specific times';