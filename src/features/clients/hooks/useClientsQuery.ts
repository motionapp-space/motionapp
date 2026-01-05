import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listClients } from "../api/clients.api";
import type { ClientsFilters } from "../types";

export function useClientsQuery(filters: ClientsFilters) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);
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
    
    enabled: isAuthenticated === true,
  });

  return query;
}
