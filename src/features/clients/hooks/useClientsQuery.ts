import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listClients } from "../api/clients.api";
import type { ClientsFilters } from "../types";

export function useClientsQuery(filters: ClientsFilters) {
  const { 
    q = "", 
    tag = "", 
    sort = "updated_desc", 
    page = 1, 
    limit = 25,
    withActivePlan,
    withActivePackage,
    withoutPlan,
    packageToRenew,
    withoutAppointment,
    lowActivity,
    includeArchived,
    planWeeksRange,
    packageStatuses,
    appointmentStatuses,
    activityStatuses,
    lastAccessDays
  } = filters;

  const query = useQuery({
    queryKey: ["clients", { 
      q, 
      tag, 
      sort, 
      page, 
      limit,
      withActivePlan,
      withActivePackage,
      withoutPlan,
      packageToRenew,
      withoutAppointment,
      lowActivity,
      includeArchived,
      planWeeksRange,
      packageStatuses: packageStatuses?.sort(),
      appointmentStatuses: appointmentStatuses?.sort(),
      activityStatuses: activityStatuses?.sort(),
      lastAccessDays
    }],
    queryFn: () => listClients(filters),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  return query;
}
