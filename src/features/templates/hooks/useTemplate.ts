import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PlanTemplate } from "@/types/template";

export async function fetchTemplate(id: string): Promise<PlanTemplate> {
  const { data, error } = await supabase
    .from("plan_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["template", id],
    queryFn: () => fetchTemplate(id!),
    enabled: !!id,
    retry: (count, err: any) => {
      // Do not retry on 404
      const code = err?.code;
      return code !== "PGRST116" && count < 2;
    },
  });
}
