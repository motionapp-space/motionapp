import { useQuery } from "@tanstack/react-query";
import { listOutOfOfficeBlocks } from "../api/out-of-office.api";

export function useOutOfOfficeBlocksQuery() {
  return useQuery({
    queryKey: ["out-of-office-blocks"],
    queryFn: listOutOfOfficeBlocks,
  });
}
