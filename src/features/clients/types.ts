export type Sex = "M" | "F" | "ALTRO";
export type ClientStatus = "POTENZIALE" | "ATTIVO" | "SOSPESO" | "ARCHIVIATO";

export interface Client {
  id: string;
  coach_id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
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

export interface ClientWithTags extends Client {
  tags?: ClientTag[];
}

export interface CreateClientInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
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
  sort?: "updated_desc" | "updated_asc" | "name_asc" | "name_desc" | "created_desc" | "created_asc";
  page?: number;
  limit?: number;
}

export interface ClientsPageResult {
  items: ClientWithTags[];
  total: number;
  page: number;
  limit: number;
}
