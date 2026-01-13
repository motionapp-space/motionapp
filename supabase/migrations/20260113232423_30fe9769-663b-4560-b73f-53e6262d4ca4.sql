-- Add section column to feedback table
ALTER TABLE public.feedback ADD COLUMN section text;

-- Update existing rows to have a default section
UPDATE public.feedback SET section = 'altro' WHERE section IS NULL;