import { PlanStatus } from "@/features/clients/types";

export interface ClientPlan {
  id: string;
  client_id: string;
  coach_id: string;
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
}

export interface UpdateClientPlanInput {
  name?: string;
  description?: string;
  objective?: string;
  data?: any;
}