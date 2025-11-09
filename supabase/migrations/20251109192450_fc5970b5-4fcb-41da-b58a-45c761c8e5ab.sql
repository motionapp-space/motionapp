-- Fix search_path for check_package_expiration function (security linter warning)
CREATE OR REPLACE FUNCTION check_package_expiration()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- If package is expired and not already archived, set to suspended
  IF NEW.expires_at <= now() 
     AND NEW.usage_status NOT IN ('archived', 'completed') THEN
    NEW.usage_status := 'suspended';
  END IF;
  
  RETURN NEW;
END;
$$;