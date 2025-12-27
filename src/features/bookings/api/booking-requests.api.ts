import { supabase } from "@/integrations/supabase/client";
import type {
  BookingRequest,
  BookingRequestWithClient,
  CreateBookingRequestInput,
  UpdateBookingRequestInput,
  BookingRequestStatus,
} from "../types";

export async function listBookingRequests(
  filters: { status?: BookingRequestStatus } = {}
): Promise<BookingRequestWithClient[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get coach_clients for this coach
  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id, client_id")
    .eq("coach_id", user.id);

  if (!coachClients || coachClients.length === 0) return [];

  const coachClientIds = coachClients.map(cc => cc.id);

  let query = supabase
    .from("booking_requests")
    .select("*")
    .in("coach_client_id", coachClientIds)
    .order("requested_start_at", { ascending: true });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Get client names
  const clientIds = coachClients.map(cc => cc.client_id);
  const { data: clients } = await supabase
    .from("clients")
    .select("id, first_name, last_name")
    .in("id", clientIds);

  const clientMap = new Map(clients?.map(c => [c.id, c]) || []);
  const ccMap = new Map(coachClients.map(cc => [cc.id, cc.client_id]));

  return (data || []).map((req: any) => {
    const clientId = ccMap.get(req.coach_client_id);
    const client = clientId ? clientMap.get(clientId) : null;
    return {
      ...req,
      client_name: client ? `${client.first_name} ${client.last_name}` : "Unknown",
    };
  });
}

export async function getBookingRequestById(id: string): Promise<BookingRequestWithClient> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  // Get coach_client details
  const { data: cc } = await supabase
    .from("coach_clients")
    .select("client_id")
    .eq("id", data.coach_client_id)
    .single();

  const { data: client } = await supabase
    .from("clients")
    .select("first_name, last_name")
    .eq("id", cc?.client_id)
    .single();

  return {
    ...data,
    client_name: client ? `${client.first_name} ${client.last_name}` : "Unknown",
  };
}

export async function createBookingRequest(
  input: CreateBookingRequestInput
): Promise<BookingRequest> {
  const { data, error } = await supabase
    .from("booking_requests")
    .insert({
      coach_client_id: input.coach_client_id,
      requested_start_at: input.requested_start_at,
      requested_end_at: input.requested_end_at,
      notes: input.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBookingRequest(
  id: string,
  input: UpdateBookingRequestInput
): Promise<BookingRequest> {
  const { data, error } = await supabase
    .from("booking_requests")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBookingRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from("booking_requests")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function approveBookingRequest(id: string): Promise<BookingRequest> {
  return updateBookingRequest(id, { status: "APPROVED" });
}

export async function declineBookingRequest(id: string): Promise<BookingRequest> {
  return updateBookingRequest(id, { status: "DECLINED" });
}

export async function counterProposeBookingRequest(
  id: string,
  counterProposalStartAt: string,
  counterProposalEndAt: string
): Promise<BookingRequest> {
  return updateBookingRequest(id, {
    status: "COUNTER_PROPOSED",
    counter_proposal_start_at: counterProposalStartAt,
    counter_proposal_end_at: counterProposalEndAt,
  });
}
