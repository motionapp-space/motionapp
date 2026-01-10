-- Drop the original function that conflicts with the new version
-- The old function has a different parameter order and lacks p_with_invite
DROP FUNCTION IF EXISTS public.create_client_with_coach_link(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_fiscal_code text,
  p_notes text,
  p_birth_date date,
  p_sex public.sex
);