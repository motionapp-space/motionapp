import { supabase } from "@/integrations/supabase/client";

export interface AdminFeedback {
  id: string;
  user_email: string;
  type: string;
  section: string | null;
  message: string;
  page: string;
  status: string;
  created_at: string;
}

export async function fetchAllFeedback(): Promise<AdminFeedback[]> {
  const { data, error } = await supabase
    .from("feedback")
    .select("id, user_email, type, section, message, page, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching feedback:", error);
    throw error;
  }

  return data ?? [];
}
