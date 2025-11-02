export type Sex = "M" | "F" | "ALTRO";
export type ClientStatus = "POTENZIALE" | "ATTIVO" | "INATTIVO" | "ARCHIVIATO";
export type PlanStatus = "IN_CORSO" | "COMPLETATO" | "ELIMINATO";
export type ActivityType = "CREATED" | "UPDATED" | "TAGGED" | "ASSIGNED_PLAN" | "COMPLETED_PLAN" | "ARCHIVED";

export interface Client {
  id: string;
  coach_id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  fiscal_code?: string;
  birth_date?: string;
  sex?: Sex;
  status: ClientStatus;
  notes?: string;
}

export interface ClientTag {
  id: string;
  coach_id: string;
  label: string;
  color?: string;
  created_at: string;
}

export interface ClientPlanAssignment {
  id: string;
  client_id: string;
  plan_id: string;
  assigned_at: string;
  status: PlanStatus;
  note?: string;
}

export interface Measurement {
  id: string;
  client_id: string;
  date: string;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  body_fat_pct?: number;
  lean_mass_kg?: number;
  waist_cm?: number;
  hip_cm?: number;
  chest_cm?: number;
  arm_cm?: number;
  thigh_cm?: number;
}

export interface ClientActivity {
  id: string;
  client_id: string;
  type: ActivityType;
  message: string;
  created_at: string;
}

export interface ClientWithTags extends Client {
  tags?: ClientTag[];
}

export interface ClientWithDetails extends ClientWithTags {
  measurements?: Measurement[];
  activities?: ClientActivity[];
}
