import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listClients } from "../api/clients.api";
import type { ClientsFilters, ClientsPageResult } from "../types";

export function useClientsQuery(filters: ClientsFilters) {
  const { q = "", status = ["ATTIVO", "POTENZIALE", "SOSPESO"], tag = "", sort = "updated_desc", page = 1, limit = 25 } = filters;

  return useQuery({
    queryKey: ["clients", { q, status: status.sort(), tag, sort, page, limit }],
    queryFn: () => listClients(filters),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
