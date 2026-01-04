import { PlanStatus } from "@/features/clients/types";

export interface ClientPlan {
  id: string;
  coach_client_id: string;
  name: string;
  description?: string;
  objective?: string;
  data: any;
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
  // New fields from simplification
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
