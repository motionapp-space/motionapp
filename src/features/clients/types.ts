export type Sex = "M" | "F" | "ALTRO";
export type ClientStatus = "POTENZIALE" | "ATTIVO" | "INATTIVO" | "ARCHIVIATO";
export type PlanStatus = "IN_CORSO" | "COMPLETATO" | "ELIMINATO";
export type ActorType = "SYSTEM" | "PT";

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
  active_plan_id?: string;
  last_access_at?: string;
  archived_at?: string;
  version: number;
}

export interface ClientTag {
  id: string;
  coach_id: string;
  label: string;
  color?: string;
  created_at: string;
}

export interface ClientWithTags extends Client {
  tags?: ClientTag[];
}

export interface ClientWithDetails extends ClientWithTags {
  current_plan_name?: string;
  package_sessions_used?: number;
  package_sessions_total?: number;
  last_session_date?: string;
  plan_weeks_since_assignment?: number | null;
  package_status?: 'active' | 'low' | 'expired' | 'none';
  appointment_status?: 'planned' | 'unplanned';
  activity_status?: 'active' | 'low' | 'inactive';
}

export interface CreateClientInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  fiscal_code?: string;
  notes?: string;
}

export interface UpdateClientInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  sex?: Sex;
  status?: ClientStatus;
  notes?: string;
}

export interface ClientsFilters {
  q?: string;
  status?: ClientStatus[];
  tag?: string;
  sort?: "updated_desc" | "updated_asc" | "name_asc" | "name_desc" | "created_desc" | "created_asc" | "plan_weeks_asc" | "plan_weeks_desc" | "package_status" | "appointment_status" | "activity_status";
  page?: number;
  limit?: number;
  withActivePlan?: boolean;
  withActivePackage?: boolean;
  lastAccessDays?: number;
}

export interface ClientsPageResult {
  items: ClientWithDetails[];
  total: number;
  page: number;
  limit: number;
}

export interface ClientStateLog {
  id: string;
  client_id: string;
  from_status: ClientStatus | null;
  to_status: ClientStatus;
  cause: string;
  actor_type: ActorType;
  actor_id: string;
  created_at: string;
}

export interface PlanStateLog {
  id: string;
  plan_id: string;
  client_id: string;
  from_status: PlanStatus | null;
  to_status: PlanStatus;
  cause: string;
  actor_type: ActorType;
  actor_id: string;
  created_at: string;
}