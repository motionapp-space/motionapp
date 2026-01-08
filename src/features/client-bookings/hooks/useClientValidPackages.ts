import { useQuery } from "@tanstack/react-query";
import { getClientValidPackages, ClientPackageOption } from "../api/client-packages.api";

export function useClientValidPackages(slotEndAt: string | null) {
  return useQuery<ClientPackageOption[]>({
    queryKey: ["client-valid-packages", slotEndAt],
    queryFn: () => getClientValidPackages(slotEndAt!),
    enabled: !!slotEndAt,
    staleTime: 30_000, // 30s cache
  });
}
