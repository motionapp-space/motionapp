import { supabase } from "@/integrations/supabase/client";
import type { Client, ClientWithTags, ClientWithDetails, CreateClientInput, UpdateClientInput, ClientsFilters, ClientsPageResult } from "../types";

interface ComputedClientData {
  client_id: string;
  plan_weeks_since_assignment: number | null;
  package_status: 'active' | 'low' | 'expired' | 'none';
  appointment_status: 'planned' | 'unplanned';
  activity_status: 'active' | 'low' | 'inactive';
  next_appointment_date: string | null;
  has_active_plan: boolean;
}

// ========== Pure Helper Functions (exported for testing) ==========

/**
 * Sanitizza query di ricerca per uso in .or() PostgREST
 * Escapa wildcards SQL e limita lunghezza
 */
export function sanitizeSearchQuery(q: string): string {
  return q
    .trim()
    .slice(0, 80)
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Applica filtro piano attivo su array di IDs
 * Restituisce IDs filtrati in base a withActivePlan/withoutPlan
 */
export function applyActivePlanFilter(
  ids: string[],
  activePlanIds: Set<string>,
  flags: { withActivePlan?: boolean; withoutPlan?: boolean }
): string[] {
  // withActivePlan ha precedenza
  if (flags.withActivePlan === true) {
    return ids.filter(id => activePlanIds.has(id));
  }
  if (flags.withoutPlan === true) {
    return ids.filter(id => !activePlanIds.has(id));
  }
  return ids;
}

/**
 * Pagina array di IDs
 */
export function paginateIds(ids: string[], page: number, limit: number): string[] {
  const from = (page - 1) * limit;
  const to = from + limit;
  return ids.slice(from, to);
}

/**
 * Riordina items per corrispondere all'ordine di pagedIds
 * Items non presenti in orderedIds finiscono in fondo
 */
export function reorderByIds<T extends { id: string }>(items: T[], orderedIds: string[]): T[] {
  const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
  return [...items].sort((a, b) => {
    const ai = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bi = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
}

// ========== API Functions ==========

export async function listClients(filters: ClientsFilters): Promise<ClientsPageResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { 
    q = "", 
    sort = "updated_desc", 
    page = 1, 
    limit = 25,
    withActivePlan,
    lastAccessDays,
    includeArchived = false,
    withoutPlan,
    packageToRenew,
    withoutAppointment,
    lowActivity,
    packageStatuses,
    appointmentStatuses,
    activityStatuses,
    withActivePackage,
  } = filters;
  
  // ====== STEP 1: IDs del coach ======
  const statusFilter = includeArchived 
    ? ["active", "blocked", "archived"]
    : ["active", "blocked"];

  const { data: coachClients, error: ccError } = await supabase
    .from("coach_clients")
    .select("client_id, status")
    .eq("coach_id", user.id)
    .in("status", statusFilter);

  if (ccError) throw ccError;
  
  const coachClientIds = coachClients?.map(cc => cc.client_id) || [];
  const archivedClientIds = new Set(
    coachClients?.filter(cc => cc.status === 'archived').map(cc => cc.client_id) || []
  );
  
  if (coachClientIds.length === 0) {
    return { items: [], total: 0, page, limit };
  }

  // ====== STEP 2: Query IDS-ONLY con filtri DB + SORT ======
  let idsQuery = supabase
    .from("clients")
    .select("id")
    .in("id", coachClientIds);

  // Sanitize e applica ricerca
  if (q) {
    const qSafe = sanitizeSearchQuery(q);
    idsQuery = idsQuery.or(
      `first_name.ilike.%${qSafe}%,last_name.ilike.%${qSafe}%,email.ilike.%${qSafe}%`
    );
  }

  // Last access filter
  if (lastAccessDays !== undefined && lastAccessDays > 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lastAccessDays);
    idsQuery = idsQuery.gte("last_access_at", cutoffDate.toISOString());
  }

  // Sort sulla query ids (mantiene ordine per paginazione)
  switch (sort) {
    case "created_desc":
      idsQuery = idsQuery.order("created_at", { ascending: false });
      break;
    case "created_asc":
      idsQuery = idsQuery.order("created_at", { ascending: true });
      break;
    case "name_asc":
      idsQuery = idsQuery.order("last_name", { ascending: true })
                         .order("first_name", { ascending: true });
      break;
    case "name_desc":
      idsQuery = idsQuery.order("last_name", { ascending: false })
                         .order("first_name", { ascending: false });
      break;
    case "updated_asc":
      idsQuery = idsQuery.order("updated_at", { ascending: true });
      break;
    // Legacy sort values fallback to updated_desc
    case "plan_weeks_asc":
    case "plan_weeks_desc":
    case "updated_desc":
    default:
      idsQuery = idsQuery.order("updated_at", { ascending: false });
      break;
  }

  const { data: dbFilteredData, error: idsError } = await idsQuery;
  if (idsError) throw idsError;

  let dbFilteredIds = (dbFilteredData || []).map(c => c.id);

  if (dbFilteredIds.length === 0) {
    return { items: [], total: 0, page, limit };
  }

  // ====== STEP 3: Filtro piano attivo (server-assisted, scoped al coach) ======
  const needsActivePlanFilter = withActivePlan === true || withoutPlan === true;
  let finalIds = dbFilteredIds;

  if (needsActivePlanFilter) {
    const { data: activeAssignments } = await supabase
      .from("client_plan_assignments")
      .select("client_id")
      .eq("coach_id", user.id)
      .eq("status", "ACTIVE")
      .in("client_id", dbFilteredIds);
    
    const activePlanIdSet = new Set(
      (activeAssignments || []).map(a => a.client_id)
    );
    
    // Usa helper pure
    finalIds = applyActivePlanFilter(dbFilteredIds, activePlanIdSet, {
      withActivePlan,
      withoutPlan,
    });
    
    if (finalIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }
  }

  // ====== STEP 4: Total corretto (dopo tutti i filtri) ======
  const total = finalIds.length;

  // ====== STEP 5: Paginazione manuale sugli IDs ======
  const pagedIds = paginateIds(finalIds, page, limit);

  if (pagedIds.length === 0) {
    return { items: [], total, page, limit };
  }

  // ====== STEP 6: Query DETTAGLI (NO .order() - ordine gestito in memoria) ======
  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      tags:client_tag_on_client(
        tag:client_tags(*)
      ),
      coach_client:coach_clients!coach_clients_client_id_fkey(
        packages:package(package_id, consumed_sessions, total_sessions),
        sessions:training_sessions(id, started_at)
      )
    `)
    .in("id", pagedIds);

  if (error) throw error;

  // ====== STEP 7: compute-client-data ======
  let computedDataMap: Record<string, ComputedClientData> = {};
  if (pagedIds.length > 0) {
    try {
      const { data: computedData, error: computeError } = await supabase.functions.invoke(
        'compute-client-data',
        { body: { clientIds: pagedIds } }
      );

      if (!computeError && computedData?.data) {
        computedDataMap = computedData.data.reduce(
          (acc: Record<string, ComputedClientData>, item: ComputedClientData) => {
            acc[item.client_id] = item;
            return acc;
          }, 
          {}
        );
      }
    } catch (err) {
      console.error('Failed to compute client data:', err);
    }
  }

  // ====== STEP 8: Transform ======
  let items: ClientWithDetails[] = (data || []).map((client: any) => {
    const coachClient = client.coach_client?.[0];
    const activePackage = coachClient?.packages?.find(
      (p: any) => p.consumed_sessions < p.total_sessions
    );
    const lastSession = coachClient?.sessions?.sort(
      (a: any, b: any) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    )[0];

    const computed = computedDataMap[client.id];
    const isArchived = archivedClientIds.has(client.id);

    return {
      ...client,
      tags: client.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      package_sessions_used: activePackage?.consumed_sessions,
      package_sessions_total: activePackage?.total_sessions,
      last_session_date: lastSession?.started_at,
      plan_weeks_since_assignment: computed?.plan_weeks_since_assignment,
      package_status: computed?.package_status,
      appointment_status: computed?.appointment_status,
      activity_status: computed?.activity_status,
      next_appointment_date: computed?.next_appointment_date,
      has_active_plan: computed?.has_active_plan ?? false,
      isArchived,
      coach_client: undefined,
    };
  });

  // Riordina per corrispondere a pagedIds
  items = reorderByIds(items, pagedIds);

  // ====== Filtri client-side rimanenti ======
  // Active package filter
  if (withActivePackage !== undefined) {
    items = items.filter(client => {
      const hasActivePackage = client.package_sessions_total !== undefined && 
        client.package_sessions_used !== undefined &&
        client.package_sessions_used < client.package_sessions_total;
      return withActivePackage ? hasActivePackage : !hasActivePackage;
    });
  }

  if (packageToRenew) {
    items = items.filter(c => c.package_status === 'expired');
  }
  if (withoutAppointment) {
    items = items.filter(c => c.appointment_status === 'unplanned');
  }
  if (lowActivity) {
    items = items.filter(c => 
      c.activity_status === 'low' || c.activity_status === 'inactive'
    );
  }
  if (packageStatuses && packageStatuses.length > 0) {
    items = items.filter(c => packageStatuses.includes(c.package_status!));
  }
  if (appointmentStatuses && appointmentStatuses.length > 0) {
    items = items.filter(c => appointmentStatuses.includes(c.appointment_status!));
  }
  if (activityStatuses && activityStatuses.length > 0) {
    items = items.filter(c => activityStatuses.includes(c.activity_status!));
  }

  return { items, total, page, limit };
}

export async function getClientById(id: string): Promise<ClientWithTags> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: ccData, error: ccError } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("coach_id", user.id)
    .eq("client_id", id)
    .maybeSingle();

  if (ccError) throw ccError;
  if (!ccData) throw new Error("Client not found or not accessible");

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

  const { data: clientId, error: rpcError } = await supabase.rpc("create_client_with_coach_link", {
    p_first_name: input.first_name,
    p_last_name: input.last_name,
    p_email: input.email || null,
    p_phone: input.phone || null,
    p_fiscal_code: input.fiscal_code || null,
    p_notes: input.notes || null,
    p_with_invite: input.withInvite ?? false,
  });

  if (rpcError) throw rpcError;
  if (!clientId) throw new Error("Failed to create client");

  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (fetchError) throw fetchError;

  return client;
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<Client> {
  const profileData = input;
  
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
