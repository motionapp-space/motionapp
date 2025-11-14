import { supabase } from "@/integrations/supabase/client";

export async function logClientActivity(
  clientId: string,
  type: string,
  message: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        type: type as any,
        message,
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging client activity:", error);
    }
  } catch (error) {
    console.error("Error logging client activity:", error);
  }
}
