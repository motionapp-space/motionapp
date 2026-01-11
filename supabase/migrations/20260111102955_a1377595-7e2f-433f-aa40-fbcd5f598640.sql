-- ================================================================
-- SIMPLIFIED TRIGGER: Only create users record, no automatic roles
-- ================================================================

-- Simplify the handle_new_user trigger to ONLY create the users record
-- Role assignment is now explicit in the code that creates the user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- ONLY create the base identity record in users table
  -- NO automatic role assignment - this is handled by the calling code
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name);
  
  RETURN NEW;
END;
$$;

-- ================================================================
-- CLEANUP: Remove incorrect coach role from Matthew Count
-- ================================================================

-- Remove coach role from Matthew Count (user_id: 1ef0f812-bac8-4b2e-a262-566e36f892c1)
-- He should only have the 'client' role
DELETE FROM user_roles 
WHERE user_id = '1ef0f812-bac8-4b2e-a262-566e36f892c1' 
AND role = 'coach';

-- Remove coaches table entry for Matthew Count
DELETE FROM coaches 
WHERE id = '1ef0f812-bac8-4b2e-a262-566e36f892c1';