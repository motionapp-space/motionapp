
-- ============================================================
-- STEP 1: Schema evolution for client_plan_assignments
-- ============================================================

-- Add missing columns
ALTER TABLE client_plan_assignments
  ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS ended_at timestamptz;

-- Change FK: plan_id now references client_plans instead of plans (legacy template table)
ALTER TABLE client_plan_assignments
  DROP CONSTRAINT IF EXISTS client_plan_assignments_plan_id_fkey;

ALTER TABLE client_plan_assignments
  ADD CONSTRAINT client_plan_assignments_plan_id_fkey
  FOREIGN KEY (plan_id) REFERENCES client_plans(id) ON DELETE CASCADE;

-- Unique constraint: only one ACTIVE assignment per (coach_id, client_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_assignment_per_coach_client
  ON client_plan_assignments (coach_id, client_id)
  WHERE status = 'ACTIVE';

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_cpa_coach_id ON client_plan_assignments (coach_id);
CREATE INDEX IF NOT EXISTS idx_cpa_status_active ON client_plan_assignments (status) WHERE status = 'ACTIVE';

-- ============================================================
-- STEP 2: RPC transazionale fsm_assign_plan
-- Executes all ASSIGN_PLAN logic in a single DB transaction.
-- If any step fails, the entire transaction is rolled back.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fsm_assign_plan(
  p_coach_id uuid,
  p_client_id uuid,
  p_coach_client_id uuid,
  p_plan_name text,
  p_plan_description text DEFAULT NULL,
  p_plan_data jsonb DEFAULT '{"days":[]}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_plan_id uuid;
  v_old_assignment RECORD;
BEGIN
  -- 1. Close existing ACTIVE assignments for this coach-client pair
  --    (batch update, not a loop)
  FOR v_old_assignment IN
    UPDATE client_plan_assignments
    SET status = 'COMPLETED', ended_at = now()
    WHERE coach_id = p_coach_id
      AND client_id = p_client_id
      AND status = 'ACTIVE'
    RETURNING id, plan_id
  LOOP
    -- 2. Log each old assignment closure
    INSERT INTO plan_state_logs (plan_id, client_id, from_status, to_status, cause, actor_type, actor_id)
    VALUES (v_old_assignment.plan_id, p_client_id, 'IN_CORSO', 'COMPLETATO', 'AUTO_COMPLETE_ON_NEW_PLAN', 'PT', p_coach_id);
  END LOOP;

  -- 3. Create client_plans record
  --    ⚠️ client_plans.status is FROZEN at 'IN_CORSO' (legacy value).
  --    The business lifecycle is managed ONLY by client_plan_assignments.status.
  --    Do NOT update client_plans.status from the FSM.
  INSERT INTO client_plans (coach_client_id, name, description, data, status, is_visible)
  VALUES (p_coach_client_id, p_plan_name, p_plan_description, p_plan_data, 'IN_CORSO', true)
  RETURNING id INTO v_new_plan_id;

  -- 4. Create new ACTIVE assignment
  --    ✅ client_plan_assignments.status is the SOLE source of truth
  --    for the plan lifecycle.
  INSERT INTO client_plan_assignments (coach_id, client_id, plan_id, status, assigned_at)
  VALUES (p_coach_id, p_client_id, v_new_plan_id, 'ACTIVE', now());

  -- 5. [COMPAT LAYER] Sync coach_clients.active_plan_id
  --    ⚠️ This is NOT the source of truth. It exists only for backward
  --    compatibility with existing queries, UI filters, and legacy APIs.
  UPDATE coach_clients
  SET active_plan_id = v_new_plan_id
  WHERE id = p_coach_client_id;

  -- 6. Log the new assignment (using legacy enum values for plan_state_logs compat)
  INSERT INTO plan_state_logs (plan_id, client_id, from_status, to_status, cause, actor_type, actor_id)
  VALUES (v_new_plan_id, p_client_id, NULL, 'IN_CORSO', 'ASSIGN_PLAN', 'PT', p_coach_id);

  RETURN jsonb_build_object(
    'success', true,
    'plan_id', v_new_plan_id,
    'old_assignment_closed', (v_old_assignment.id IS NOT NULL)
  );
END;
$$;

-- ============================================================
-- STEP 3: RLS policies update (use direct coach_id for efficiency)
-- ============================================================

DROP POLICY IF EXISTS "Coaches can view assignments for their clients" ON client_plan_assignments;
CREATE POLICY "Coaches can view assignments for their clients"
  ON client_plan_assignments FOR SELECT
  USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can create assignments for their clients" ON client_plan_assignments;
CREATE POLICY "Coaches can create assignments for their clients"
  ON client_plan_assignments FOR INSERT
  WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can update assignments for their clients" ON client_plan_assignments;
CREATE POLICY "Coaches can update assignments for their clients"
  ON client_plan_assignments FOR UPDATE
  USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can delete assignments for their clients" ON client_plan_assignments;
CREATE POLICY "Coaches can delete assignments for their clients"
  ON client_plan_assignments FOR DELETE
  USING (coach_id = auth.uid());
