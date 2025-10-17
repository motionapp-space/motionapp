-- Phase 1: Create new schema for Templates & Client Plans
-- Preserves existing plans data, adds new structures

-- 1) Plan Templates (repository)
CREATE TABLE IF NOT EXISTS public.plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL DEFAULT '{"days": []}'::jsonb,
  
  category TEXT,
  
  -- Audit
  created_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2) Template Tags
CREATE TABLE IF NOT EXISTS public.plan_template_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(coach_id, label)
);

-- 3) Template-Tag junction
CREATE TABLE IF NOT EXISTS public.plan_template_tag_on_template (
  template_id UUID NOT NULL REFERENCES public.plan_templates(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.plan_template_tags(id) ON DELETE CASCADE,
  
  PRIMARY KEY (template_id, tag_id)
);

-- 4) Client Plans (detached from templates)
CREATE TABLE IF NOT EXISTS public.client_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL DEFAULT '{"days": []}'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'EXPIRED')),
  
  -- Traceability only (no cascade effects)
  derived_from_template_id UUID REFERENCES public.plan_templates(id) ON DELETE SET NULL
);

-- 5) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plan_templates_coach_updated 
  ON public.plan_templates(coach_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_plan_templates_coach_name 
  ON public.plan_templates(coach_id, name);

CREATE INDEX IF NOT EXISTS idx_client_plans_client_updated 
  ON public.client_plans(client_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_plans_coach_status 
  ON public.client_plans(coach_id, status);

-- 6) Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_plan_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_plan_templates_updated_at
  BEFORE UPDATE ON public.plan_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_plan_template_updated_at();

CREATE OR REPLACE FUNCTION public.update_client_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_client_plans_updated_at
  BEFORE UPDATE ON public.client_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_plan_updated_at();

-- 7) RLS Policies - Templates
ALTER TABLE public.plan_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own templates"
  ON public.plan_templates FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create templates"
  ON public.plan_templates FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own templates"
  ON public.plan_templates FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own templates"
  ON public.plan_templates FOR DELETE
  USING (coach_id = auth.uid());

-- 8) RLS Policies - Template Tags
ALTER TABLE public.plan_template_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own template tags"
  ON public.plan_template_tags FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create template tags"
  ON public.plan_template_tags FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own template tags"
  ON public.plan_template_tags FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own template tags"
  ON public.plan_template_tags FOR DELETE
  USING (coach_id = auth.uid());

-- 9) RLS Policies - Template-Tag junction
ALTER TABLE public.plan_template_tag_on_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view template-tag links for own templates"
  ON public.plan_template_tag_on_template FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_templates
      WHERE id = template_id AND coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create template-tag links for own templates"
  ON public.plan_template_tag_on_template FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plan_templates
      WHERE id = template_id AND coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete template-tag links for own templates"
  ON public.plan_template_tag_on_template FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_templates
      WHERE id = template_id AND coach_id = auth.uid()
    )
  );

-- 10) RLS Policies - Client Plans
ALTER TABLE public.client_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view client plans for their clients"
  ON public.client_plans FOR SELECT
  USING (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = client_id AND coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create client plans for their clients"
  ON public.client_plans FOR INSERT
  WITH CHECK (
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = client_id AND coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update client plans for their clients"
  ON public.client_plans FOR UPDATE
  USING (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = client_id AND coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete client plans for their clients"
  ON public.client_plans FOR DELETE
  USING (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = client_id AND coach_id = auth.uid()
    )
  );

-- 11) Migrate existing plans to templates
-- Copy all non-template plans from the 'plans' table to 'plan_templates'
INSERT INTO public.plan_templates (id, created_at, updated_at, coach_id, name, description, data, category, created_by_id)
SELECT 
  id,
  created_at,
  updated_at,
  coach_id,
  name,
  COALESCE(goal, '') as description,
  content_json as data,
  goal as category,
  coach_id as created_by_id
FROM public.plans
WHERE is_template = false
ON CONFLICT (id) DO NOTHING;

-- 12) Activity log helper for client plan changes
CREATE OR REPLACE FUNCTION public.log_client_plan_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.client_activities (client_id, type, message)
    VALUES (NEW.client_id, 'UPDATED', 'Plan "' || NEW.name || '" assigned');
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO public.client_activities (client_id, type, message)
    VALUES (NEW.client_id, 'UPDATED', 'Plan "' || NEW.name || '" status changed to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER log_client_plan_changes
  AFTER INSERT OR UPDATE ON public.client_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.log_client_plan_activity();