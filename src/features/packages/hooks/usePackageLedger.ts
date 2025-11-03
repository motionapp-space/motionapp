import { useQuery } from "@tanstack/react-query";
import { getPackageLedger } from "../api/ledger.api";

export function usePackageLedger(packageId: string | undefined) {
  return useQuery({
    queryKey: ["package-ledger", packageId],
    queryFn: () => getPackageLedger(packageId!),
    enabled: !!packageId,
  });
}
