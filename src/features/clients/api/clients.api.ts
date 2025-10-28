import { supabase } from "@/integrations/supabase/client";
import type { Client, ClientWithTags, CreateClientInput, UpdateClientInput, ClientsFilters, ClientsPageResult } from "../types";

export async function listClients(filters: ClientsFilters): Promise<ClientsPageResult> {
  const { q = "", status = ["ATTIVO", "POTENZIALE", "INATTIVO"], tag = "", sort = "updated_desc", page = 1, limit = 25 } = filters;
  
  let query = supabase
    .from("clients")
    .select(`
      *,
      tags:client_tag_on_client(
        tag:client_tags(*)
      )
    `, { count: "exact" });

  // Status filter (default excludes ARCHIVIATO)
  if (status.length > 0) {
    query = query.in("status", status);
  }

  // Search filter
  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`);
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

  // Transform tags structure
  const items: ClientWithTags[] = (data || []).map((client: any) => ({
    ...client,
    tags: client.tags?.map((t: any) => t.tag).filter(Boolean) || [],
  }));

  return {
    items,
    total: count || 0,
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
  const { data, error } = await supabase
    .from("clients")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function archiveClient(id: string): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ status: "ARCHIVIATO" })
    .eq("id", id);

  if (error) throw error;
}

export async function unarchiveClient(id: string): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update({ status: "ATTIVO" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  
  // Log activity
  await supabase.from("client_activities").insert({
    client_id: id,
    type: "UPDATED",
    message: "Cliente ripristinato (status=ATTIVO)",
  });

  return data;
}
