-- Client Management Module (MVP 2)
-- Creates tables for client management with proper RLS and relations to existing plans

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE sex AS ENUM ('M', 'F', 'ALTRO');
CREATE TYPE client_status AS ENUM ('POTENZIALE', 'ATTIVO', 'SOSPESO', 'ARCHIVIATO');
CREATE TYPE plan_status AS ENUM ('ATTIVA', 'COMPLETATA', 'SCADUTA');
CREATE TYPE activity_type AS ENUM ('CREATED', 'UPDATED', 'TAGGED', 'ASSIGNED_PLAN', 'COMPLETED_PLAN', 'ARCHIVED');

-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  birth_date DATE,
  sex sex,
  
  status client_status NOT NULL DEFAULT 'POTENZIALE',
  notes TEXT,
  
  CONSTRAINT uq_client_email UNIQUE (email)
);

CREATE INDEX idx_clients_coach_id ON public.clients(coach_id);
CREATE INDEX idx_clients_last_name_first_name ON public.clients(last_name, first_name);
CREATE INDEX idx_clients_created_at ON public.clients(created_at);
CREATE INDEX idx_clients_status ON public.clients(status);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Coaches can view their own clients"
  ON public.clients FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own clients"
  ON public.clients FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own clients"
  ON public.clients FOR DELETE
  USING (coach_id = auth.uid());

-- Client Tags table
CREATE TABLE public.client_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT uq_client_tag_coach_label UNIQUE (coach_id, label)
);

CREATE INDEX idx_client_tags_coach_id ON public.client_tags(coach_id);

-- Enable RLS
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_tags
CREATE POLICY "Coaches can view their own tags"
  ON public.client_tags FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create tags"
  ON public.client_tags FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own tags"
  ON public.client_tags FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own tags"
  ON public.client_tags FOR DELETE
  USING (coach_id = auth.uid());

-- Client Tag Junction table
CREATE TABLE public.client_tag_on_client (
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.client_tags(id) ON DELETE CASCADE,
  
  PRIMARY KEY (client_id, tag_id)
);

CREATE INDEX idx_client_tag_on_client_client_id ON public.client_tag_on_client(client_id);
CREATE INDEX idx_client_tag_on_client_tag_id ON public.client_tag_on_client(tag_id);

-- Enable RLS
ALTER TABLE public.client_tag_on_client ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_tag_on_client
CREATE POLICY "Coaches can view tags for their clients"
  ON public.client_tag_on_client FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_tag_on_client.client_id
    AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can add tags to their clients"
  ON public.client_tag_on_client FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_tag_on_client.client_id
    AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can remove tags from their clients"
  ON public.client_tag_on_client FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_tag_on_client.client_id
    AND clients.coach_id = auth.uid()
  ));

-- Client Plan Assignments table
CREATE TABLE public.client_plan_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status plan_status NOT NULL DEFAULT 'ATTIVA',
  note TEXT
);

CREATE INDEX idx_client_plan_assignments_client_id ON public.client_plan_assignments(client_id);
CREATE INDEX idx_client_plan_assignments_plan_id ON public.client_plan_assignments(plan_id);
CREATE INDEX idx_client_plan_assignments_status ON public.client_plan_assignments(status);

-- Enable RLS
ALTER TABLE public.client_plan_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_plan_assignments
CREATE POLICY "Coaches can view assignments for their clients"
  ON public.client_plan_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_plan_assignments.client_id
    AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can create assignments for their clients"
  ON public.client_plan_assignments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_plan_assignments.client_id
    AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can update assignments for their clients"
  ON public.client_plan_assignments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_plan_assignments.client_id
    AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can delete assignments for their clients"
  ON public.client_plan_assignments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_plan_assignments.client_id
    AND clients.coach_id = auth.uid()
  ));

-- Measurements table
CREATE TABLE public.measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  bmi DECIMAL(5,2),
  body_fat_pct DECIMAL(5,2),
  lean_mass_kg DECIMAL(5,2),
  waist_cm DECIMAL(5,2),
  hip_cm DECIMAL(5,2),
  chest_cm DECIMAL(5,2),
  arm_cm DECIMAL(5,2),
  thigh_cm DECIMAL(5,2)
);

CREATE INDEX idx_measurements_client_id_date ON public.measurements(client_id, date DESC);

-- Enable RLS
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for measurements
CREATE POLICY "Coaches can view measurements for their clients"
  ON public.measurements FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = measurements.client_id
    AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can create measurements for their clients"
  ON public.measurements FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = measurements.client_id
    AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can update measurements for their clients"
  ON public.measurements FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = measurements.client_id
    AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can delete measurements for their clients"
  ON public.measurements FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = measurements.client_id
    AND clients.coach_id = auth.uid()
  ));

-- Client Activities table
CREATE TABLE public.client_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_activities_client_id_created_at ON public.client_activities(client_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_activities
CREATE POLICY "Coaches can view activities for their clients"
  ON public.client_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_activities.client_id
    AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can create activities for their clients"
  ON public.client_activities FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_activities.client_id
    AND clients.coach_id = auth.uid()
  ));

-- Trigger to update updated_at on clients
CREATE OR REPLACE FUNCTION public.update_client_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_updated_at();

-- Function to auto-calculate BMI on measurement insert/update
CREATE OR REPLACE FUNCTION public.calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.weight_kg IS NOT NULL AND NEW.height_cm IS NOT NULL AND NEW.height_cm > 0 THEN
    NEW.bmi = NEW.weight_kg / ((NEW.height_cm / 100) * (NEW.height_cm / 100));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER calculate_measurement_bmi
  BEFORE INSERT OR UPDATE ON public.measurements
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_bmi();