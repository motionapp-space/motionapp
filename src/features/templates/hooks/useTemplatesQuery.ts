import { useQuery } from "@tanstack/react-query";
import { getTemplates } from "../api/templates.api";

export function useTemplatesQuery(filters?: {
  q?: string;
  category?: string;
  tag?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: ["templates", filters],
    queryFn: () => getTemplates(filters),
  });
}
