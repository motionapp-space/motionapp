import { supabase } from "@/integrations/supabase/client";
import type {
  BookingRequest,
  BookingRequestWithClient,
  CreateBookingRequestInput,
  UpdateBookingRequestInput,
} from "../types";

export async function listBookingRequests(): Promise<BookingRequestWithClient[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("booking_requests")
    .select(`
      *,
      clients!inner(first_name, last_name)
    `)
    .eq("coach_id", user.id)
    .order("requested_start_at", { ascending: true });

  if (error) throw error;

  return data.map((req: any) => ({
    ...req,
    client_name: `${req.clients.first_name} ${req.clients.last_name}`,
  }));
}

export async function getBookingRequestById(id: string): Promise<BookingRequestWithClient> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("booking_requests")
    .select(`
      *,
      clients!inner(first_name, last_name)
    `)
    .eq("id", id)
    .eq("coach_id", user.id)
    .single();

  if (error) throw error;

  return {
    ...data,
    client_name: `${data.clients.first_name} ${data.clients.last_name}`,
  };
}

export async function createBookingRequest(
  input: CreateBookingRequestInput
): Promise<BookingRequest> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("booking_requests")
    .insert({
      coach_id: user.id,
      ...input,
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
