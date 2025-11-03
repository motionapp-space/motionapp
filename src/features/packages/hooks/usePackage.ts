import { useQuery } from "@tanstack/react-query";
import { getPackage } from "../api/packages.api";

export function usePackage(packageId: string | undefined) {
  return useQuery({
    queryKey: ["package", packageId],
    queryFn: () => getPackage(packageId!),
    enabled: !!packageId,
  });
}
