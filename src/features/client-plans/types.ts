/** @deprecated Legacy frozen field. Do NOT use for business logic. */
type PlanStatus = "IN_CORSO" | "COMPLETATO" | "ELIMINATO";

// ============================================================
// ASSIGNMENT STATUS — SOLE SOURCE OF TRUTH
// client_plan_assignments.status is the ONLY authoritative source
// for the plan lifecycle. client_plans.status is legacy/frozen
// and must NOT be used for business logic decisions.
// ============================================================
export type AssignmentStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export interface ClientPlanAssignment {
  id: string;
  coach_id: string;
  client_id: string;
  plan_id: string;
  status: AssignmentStatus;
  assigned_at: string;
  ended_at?: string;
  note?: string;
}

export interface ClientPlan {
  id: string;
  coach_client_id: string;
  name: string;
  description?: string;
  objective?: string;
  data: any;
  /** @deprecated FROZEN/LEGACY — Do NOT use for business logic. Use ClientPlanAssignment.status instead. */
  status: PlanStatus;
  is_visible: boolean;
  is_in_use: boolean;
  locked_at?: string;
  completed_at?: string;
  deleted_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
  derived_from_template_id?: string;
  duration_weeks?: number;
  in_use_at?: string;
  last_used_at?: string;
}

export interface ClientPlanWithActive extends ClientPlan {
  isActiveForClient: boolean;
  template?: {
    id: string;
    name: string;
  } | null;
}

export interface UpdateClientPlanInput {
  name?: string;
  description?: string;
  objective?: string;
  data?: any;
}

// Snapshot type for immutable session history
export interface PlanDaySnapshot {
  plan_id: string;
  plan_name: string | null;
  day_id: string;
  day_title: string | null;
  day_structure: any | null;
  captured_at: string;
  warning?: "PLAN_NOT_FOUND" | "DAY_NOT_FOUND";
}
