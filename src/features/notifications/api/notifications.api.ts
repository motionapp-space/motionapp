import { supabase } from "@/integrations/supabase/client";
import type { CoachNotification } from "../types";

export async function listNotifications(): Promise<CoachNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("coach_notifications")
    .select("*")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as CoachNotification[];
}

export async function markAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("coach_notifications")
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq("id", id);

  if (error) throw error;
}

export async function markAllAsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("coach_notifications")
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq("coach_id", user.id)
    .eq("is_read", false);

  if (error) throw error;
}
