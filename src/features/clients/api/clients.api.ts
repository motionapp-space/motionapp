import { supabase } from "@/integrations/supabase/client";
import type { Client, ClientWithTags, ClientWithDetails, CreateClientInput, UpdateClientInput, ClientsFilters, ClientsPageResult } from "../types";

export async function listClients(filters: ClientsFilters): Promise<ClientsPageResult> {
  const { 
    q = "", 
    status = ["ATTIVO", "POTENZIALE", "INATTIVO"], 
    tag = "", 
    sort = "updated_desc", 
    page = 1, 
    limit = 25,
    withActivePlan,
    withActivePackage,
    lastAccessDays
  } = filters;
  
  let query = supabase
    .from("clients")
    .select(`
      *,
      tags:client_tag_on_client(
        tag:client_tags(*)
      ),
      current_plan:client_plans!active_plan_id(name),
      packages:package(package_id, consumed_sessions, total_sessions),
      sessions:training_sessions(id, started_at)
    `, { count: "exact" });

  // Status filter (default excludes ARCHIVIATO)
  if (status.length > 0) {
    query = query.in("status", status);
  }

  // Search filter
  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  // Active plan filter
  if (withActivePlan !== undefined) {
    if (withActivePlan) {
      query = query.not("active_plan_id", "is", null);
    } else {
      query = query.is("active_plan_id", null);
    }
  }

  // Active package filter
  if (withActivePackage !== undefined) {
    // This is a client-side filter applied below since we can't do this easily in Postgres
  }

  // Last access filter
  if (lastAccessDays !== undefined && lastAccessDays > 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lastAccessDays);
    query = query.gte("last_access_at", cutoffDate.toISOString());
  }

  // Sorting
  switch (sort) {
    case "created_desc":
      query = query.order("created_at", { ascending: false });
      break;
    case "created_asc":
      query = query.order("created_at", { ascending: true });
      break;
    case "name_asc":
      query = query.order("last_name", { ascending: true }).order("first_name", { ascending: true });
      break;
    case "name_desc":
      query = query.order("last_name", { ascending: false }).order("first_name", { ascending: false });
      break;
    case "updated_asc":
      query = query.order("updated_at", { ascending: true });
      break;
    case "updated_desc":
    default:
      query = query.order("updated_at", { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  // Transform data structure
  let items: ClientWithDetails[] = (data || []).map((client: any) => {
    const activePackage = client.packages?.find((p: any) => p.consumed_sessions < p.total_sessions);
    const lastSession = client.sessions?.sort((a: any, b: any) => 
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    )[0];

    return {
      ...client,
      tags: client.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      current_plan_name: client.current_plan?.name,
      package_sessions_used: activePackage?.consumed_sessions,
      package_sessions_total: activePackage?.total_sessions,
      last_session_date: lastSession?.started_at,
      packages: undefined,
      sessions: undefined,
      current_plan: undefined,
    };
  });

  // Apply client-side package filter
  if (withActivePackage !== undefined) {
    items = items.filter(client => {
      const hasActivePackage = client.package_sessions_total !== undefined && 
        client.package_sessions_used !== undefined &&
        client.package_sessions_used < client.package_sessions_total;
      return withActivePackage ? hasActivePackage : !hasActivePackage;
    });
  }

  return {
    items,
    total: withActivePackage !== undefined ? items.length : (count || 0),
    page,
    limit,
  };
}

export async function getClientById(id: string): Promise<ClientWithTags> {
  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      tags:client_tag_on_client(
        tag:client_tags(*)
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  return {
    ...data,
    tags: data.tags?.map((t: any) => t.tag).filter(Boolean) || [],
  };
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("clients")
    .insert({
      ...input,
      coach_id: user.id,
      status: "POTENZIALE",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<Client> {
  // CASO II: Strip out FSM-controlled fields to prevent manual status changes
  const { status, active_plan_id, archived_at, ...profileData } = input as any;
  
  const { data, error } = await supabase
    .from("clients")
    .update(profileData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Removed: archiveClient and unarchiveClient now use FSM via client-fsm.api.ts
