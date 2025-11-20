import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listClients } from "../api/clients.api";
import type { ClientsFilters, ClientsPageResult } from "../types";
import { useMemo } from "react";
import { applyQuickFilters, applySorting } from "../utils/client-filters";

export function useClientsQuery(filters: ClientsFilters) {
  const { q = "", status = ["ATTIVO", "POTENZIALE", "SOSPESO"], tag = "", sort = "updated_desc", page = 1, limit = 25, quickFilters } = filters;

  const query = useQuery({
    queryKey: ["clients", { q, status: status.sort(), tag, sort, page, limit }],
    queryFn: () => listClients(filters),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const processedData = useMemo(() => {
    if (!query.data) return query.data;

    let items = query.data.items;

    // Applica quick filters client-side
    if (quickFilters && quickFilters.length > 0) {
      items = applyQuickFilters(items, quickFilters);
    }

    // Applica ordinamento client-side per le nuove colonne
    if (sort && ["plan_weeks_asc", "plan_weeks_desc", "package_status", "appointment_status", "activity_status"].includes(sort)) {
      items = applySorting(items, sort);
    }

    return {
      ...query.data,
      items,
      total: items.length
    };
  }, [query.data, quickFilters, sort]);

  return {
    ...query,
    data: processedData
  };
}
