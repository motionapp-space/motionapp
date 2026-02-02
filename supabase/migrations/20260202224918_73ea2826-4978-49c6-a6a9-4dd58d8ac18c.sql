-- Create coach_invites table for magic link invitations
CREATE TABLE public.coach_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  email TEXT,
  max_uses INTEGER DEFAULT 1 NOT NULL CHECK (max_uses > 0),
  used_count INTEGER DEFAULT 0 NOT NULL CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  CONSTRAINT used_count_lte_max_uses CHECK (used_count <= max_uses)
);

-- Index for fast code lookup
CREATE INDEX idx_coach_invites_code ON public.coach_invites(code);

-- Enable RLS
ALTER TABLE public.coach_invites ENABLE ROW LEVEL SECURITY;

-- Only admins can view invites
CREATE POLICY "Admin can view coach invites"
  ON public.coach_invites FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can create invites
CREATE POLICY "Admin can create coach invites"
  ON public.coach_invites FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));