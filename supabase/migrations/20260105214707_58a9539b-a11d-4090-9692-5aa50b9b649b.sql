-- Create atomic function to create client + coach_client relationship in one transaction
CREATE OR REPLACE FUNCTION public.create_client_with_coach_link(
  p_first_name text,
  p_last_name text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_fiscal_code text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_birth_date date DEFAULT NULL,
  p_sex public.sex DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coach_id uuid;
  v_client_id uuid;
BEGIN
  -- Get the coach ID from auth
  v_coach_id := auth.uid();
  
  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify caller has coach role
  IF NOT public.has_role(v_coach_id, 'coach') THEN
    RAISE EXCEPTION 'User is not a coach';
  END IF;
  
  -- Insert the client
  INSERT INTO public.clients (
    first_name,
    last_name,
    email,
    phone,
    fiscal_code,
    notes,
    birth_date,
    sex,
    status
  ) VALUES (
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_fiscal_code,
    p_notes,
    p_birth_date,
    p_sex,
    'POTENZIALE'
  )
  RETURNING id INTO v_client_id;
  
  -- Create the coach-client relationship
  INSERT INTO public.coach_clients (
    coach_id,
    client_id,
    role,
    status,
    started_at
  ) VALUES (
    v_coach_id,
    v_client_id,
    'primary',
    'active',
    now()
  );
  
  RETURN v_client_id;
END;
$$;