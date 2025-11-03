import { useQuery } from "@tanstack/react-query";
import { getClientPackages } from "../api/packages.api";

export function useClientPackages(clientId: string) {
  return useQuery({
    queryKey: ["packages", "client", clientId],
    queryFn: () => getClientPackages(clientId),
    enabled: !!clientId,
  });
}
