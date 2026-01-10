import { supabase } from "@/integrations/supabase/client";
import type { Client, ClientWithTags, ClientWithDetails, CreateClientInput, UpdateClientInput, ClientsFilters, ClientsPageResult } from "../types";

interface ComputedClientData {
  client_id: string;
  plan_weeks_since_assignment: number | null;
  package_status: 'active' | 'low' | 'expired' | 'none';
  appointment_status: 'planned' | 'unplanned';
  activity_status: 'active' | 'low' | 'inactive';
  next_appointment_date: string | null;
}

export async function listClients(filters: ClientsFilters): Promise<ClientsPageResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { 
    q = "", 
    tag = "", 
    sort = "updated_desc", 
    page = 1, 
    limit = 25,
    withActivePlan,
    withActivePackage,
    lastAccessDays,
    includeArchived = false,
    withoutPlan,
    packageToRenew,
    withoutAppointment,
    lowActivity,
    planWeeksRange,
    packageStatuses,
    appointmentStatuses,
    activityStatuses
  } = filters;
  
  // Get client IDs for this coach via coach_clients
  const { data: coachClients, error: ccError } = await supabase
    .from("coach_clients")
    .select("client_id")
    .eq("coach_id", user.id)
    .in("status", ["active", "invited"]);

  if (ccError) throw ccError;
  
  const clientIds = coachClients?.map(cc => cc.client_id) || [];
  
  if (clientIds.length === 0) {
    return { items: [], total: 0, page, limit };
  }

  let query = supabase
    .from("clients")
    .select(`
      *,
      tags:client_tag_on_client(
        tag:client_tags(*)
      ),
      current_plan:client_plans!active_plan_id(name),
      coach_client:coach_clients!coach_clients_client_id_fkey(
        packages:package(package_id, consumed_sessions, total_sessions),
        sessions:training_sessions(id, started_at)
      )
    `, { count: "exact" })
    .in("id", clientIds);

  // Archive filter (default excludes archived)
  if (!includeArchived) {
    query = query.is("archived_at", null);
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

  // Get client IDs for batch computation
  const batchClientIds = (data || []).map((c: any) => c.id);

  // Compute additional data via edge function
  let computedDataMap: Record<string, ComputedClientData> = {};
  if (batchClientIds.length > 0) {
    try {
      const { data: computedData, error: computeError } = await supabase.functions.invoke(
        'compute-client-data',
        { body: { clientIds: batchClientIds } }
      );

      if (!computeError && computedData?.data) {
        computedDataMap = computedData.data.reduce((acc: Record<string, ComputedClientData>, item: ComputedClientData) => {
          acc[item.client_id] = item;
          return acc;
        }, {});
      }
    } catch (err) {
      console.error('Failed to compute client data:', err);
      // Continue without computed data
    }
  }

  // Transform data structure
  let items: ClientWithDetails[] = (data || []).map((client: any) => {
    // Extract packages and sessions from the coach_client relationship
    const coachClient = client.coach_client?.[0]; // First (primary) coach_client
    const activePackage = coachClient?.packages?.find((p: any) => p.consumed_sessions < p.total_sessions);
    const lastSession = coachClient?.sessions?.sort((a: any, b: any) => 
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    )[0];

    const computed = computedDataMap[client.id];

    return {
      ...client,
      tags: client.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      current_plan_name: client.current_plan?.name,
      package_sessions_used: activePackage?.consumed_sessions,
      package_sessions_total: activePackage?.total_sessions,
      last_session_date: lastSession?.started_at,
      plan_weeks_since_assignment: computed?.plan_weeks_since_assignment,
      package_status: computed?.package_status,
      appointment_status: computed?.appointment_status,
      activity_status: computed?.activity_status,
      next_appointment_date: computed?.next_appointment_date,
      coach_client: undefined, // Remove the nested object
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

  // Client-side filtering based on computed data
  
  // Filter: Senza piano
  if (withoutPlan) {
    items = items.filter(c => c.plan_weeks_since_assignment === null);
  }
  
  // Filter: Pacchetto da rinnovare
  if (packageToRenew) {
    items = items.filter(c => c.package_status === 'expired');
  }
  
  // Filter: Senza appuntamento futuro
  if (withoutAppointment) {
    items = items.filter(c => c.appointment_status === 'unplanned');
  }
  
  // Filter: Clienti non attivi (low OR inactive)
  if (lowActivity) {
    items = items.filter(c => 
      c.activity_status === 'low' || c.activity_status === 'inactive'
    );
  }
  
  // Advanced Filter: Plan weeks range
  if (planWeeksRange) {
    items = items.filter(c => {
      const weeks = c.plan_weeks_since_assignment;
      switch (planWeeksRange) {
        case 'none': return weeks === null;
        case '0-4': return weeks !== null && weeks >= 0 && weeks < 4;
        case '4-8': return weeks !== null && weeks >= 4 && weeks < 8;
        case '8+': return weeks !== null && weeks >= 8;
        default: return true;
      }
    });
  }
  
  // Advanced Filter: Package statuses
  if (packageStatuses && packageStatuses.length > 0) {
    items = items.filter(c => 
      packageStatuses.includes(c.package_status!)
    );
  }
  
  // Advanced Filter: Appointment statuses
  if (appointmentStatuses && appointmentStatuses.length > 0) {
    items = items.filter(c => 
      appointmentStatuses.includes(c.appointment_status!)
    );
  }
  
  // Advanced Filter: Activity statuses
  if (activityStatuses && activityStatuses.length > 0) {
    items = items.filter(c => 
      activityStatuses.includes(c.activity_status!)
    );
  }

  return {
    items,
    total: items.length,
    page,
    limit,
  };
}

export async function getClientById(id: string): Promise<ClientWithTags> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify coach-client relationship exists
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

  // Use atomic RPC function to create client + coach_client relationship in one transaction
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

  // Now fetch the created client (relationship exists, so SELECT RLS will pass)
  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (fetchError) throw fetchError;

  return client;
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
