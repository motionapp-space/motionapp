import { supabase } from "@/integrations/supabase/client";
import type { ClientNotification } from "../types";

export async function listClientNotifications(): Promise<ClientNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get client_id from user_id
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (clientError) throw clientError;
  if (!client) return []; // No client profile linked

  const { data, error } = await supabase
    .from("client_notifications")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as ClientNotification[];
}

export async function markClientNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("client_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function markAllClientNotificationsAsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get client_id
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (clientError) throw clientError;
  if (!client) return;

  const { error } = await supabase
    .from("client_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("client_id", client.id)
    .eq("is_read", false);

  if (error) throw error;
}
