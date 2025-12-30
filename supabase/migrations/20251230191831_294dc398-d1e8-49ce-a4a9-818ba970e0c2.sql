-- =====================================================
-- UNIFIED IDENTITY REFACTORING - PHASE 1: DATABASE
-- =====================================================

-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('coach', 'client', 'admin');

-- 2. Create users table (centralized identity)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer functions for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 5. Migrate existing coaches to users table
INSERT INTO public.users (id, email, first_name, last_name, avatar_url, created_at)
SELECT 
  c.id,
  c.email,
  SPLIT_PART(COALESCE(c.name, ''), ' ', 1) as first_name,
  NULLIF(TRIM(SUBSTRING(COALESCE(c.name, '') FROM POSITION(' ' IN COALESCE(c.name, '')))), '') as last_name,
  c.avatar_url,
  c.created_at
FROM public.coaches c
ON CONFLICT (id) DO NOTHING;

-- 6. Assign coach role to existing coaches
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'coach'::app_role FROM public.coaches
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Migrate clients with auth_user_id to users table
INSERT INTO public.users (id, email, first_name, last_name, created_at)
SELECT 
  cl.auth_user_id,
  cl.email,
  cl.first_name,
  cl.last_name,
  cl.created_at
FROM public.clients cl
WHERE cl.auth_user_id IS NOT NULL
  AND cl.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 8. Assign client role to registered clients
INSERT INTO public.user_roles (user_id, role)
SELECT auth_user_id, 'client'::app_role 
FROM public.clients 
WHERE auth_user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 9. Add user_id column to clients (for linking registered clients)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id);

-- 10. Link registered clients to their user record
UPDATE public.clients 
SET user_id = auth_user_id 
WHERE auth_user_id IS NOT NULL;

-- 11. RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Coaches can view client profiles"
  ON public.users FOR SELECT
  USING (
    public.has_role(auth.uid(), 'coach') AND
    id IN (
      SELECT user_id FROM public.clients 
      WHERE coach_id = auth.uid() AND user_id IS NOT NULL
    )
  );

-- 12. RLS Policies for user_roles table
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- 13. Update handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- Insert into coaches table (default for new signups via /auth)
  INSERT INTO public.coaches (id)
  VALUES (NEW.id);
  
  -- Assign coach role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'coach');
  
  RETURN NEW;
END;
$$;