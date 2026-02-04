import type { ClientsFilters } from "../types";

export function getDefaultFilters(sp: URLSearchParams): ClientsFilters {
  const withActivePlan = sp.get("withActivePlan");
  const withActivePackage = sp.get("withActivePackage");
  const lastAccessDays = sp.get("lastAccessDays");
  
  // Filtri veloci
  const withoutPlan = sp.get("withoutPlan") === "true";
  const packageToRenew = sp.get("packageToRenew") === "true";
  const withoutAppointment = sp.get("withoutAppointment") === "true";
  const lowActivity = sp.get("lowActivity") === "true";
  const includeArchived = sp.get("includeArchived") === "true";
  
  // Filtri avanzati
  const planWeeksRange = sp.get("planWeeksRange") as ClientsFilters['planWeeksRange'];
  const packageStatuses = sp.getAll("packageStatus") as ClientsFilters['packageStatuses'];
  const appointmentStatuses = sp.getAll("appointmentStatus") as ClientsFilters['appointmentStatuses'];
  const activityStatuses = sp.getAll("activityStatus") as ClientsFilters['activityStatuses'];

  return {
    q: sp.get("q") || "",
    tag: sp.get("tag") || "",
    sort: (sp.get("sort") as any) || "updated_desc",
    page: Number(sp.get("page")) || 1,
    limit: Number(sp.get("limit")) || 25,
    
    // Filtri esistenti
    withActivePlan: withActivePlan ? withActivePlan === "true" : undefined,
    withActivePackage: withActivePackage ? withActivePackage === "true" : undefined,
    lastAccessDays: lastAccessDays ? Number(lastAccessDays) : undefined,
    
    // Nuovi filtri veloci
    withoutPlan: withoutPlan || undefined,
    packageToRenew: packageToRenew || undefined,
    withoutAppointment: withoutAppointment || undefined,
    lowActivity: lowActivity || undefined,
    includeArchived: includeArchived || undefined,
    
    // Nuovi filtri avanzati
    planWeeksRange: planWeeksRange || undefined,
    packageStatuses: packageStatuses?.length > 0 ? packageStatuses : undefined,
    appointmentStatuses: appointmentStatuses?.length > 0 ? appointmentStatuses : undefined,
    activityStatuses: activityStatuses?.length > 0 ? activityStatuses : undefined,
  };
}

export function filtersToSearchParams(filters: ClientsFilters): URLSearchParams {
  const sp = new URLSearchParams();
  
  if (filters.q) sp.set("q", filters.q);
  if (filters.tag) sp.set("tag", filters.tag);
  if (filters.sort) sp.set("sort", filters.sort);
  if (filters.page) sp.set("page", String(filters.page));
  if (filters.limit) sp.set("limit", String(filters.limit));
  
  // Filtri esistenti
  if (filters.withActivePlan !== undefined) sp.set("withActivePlan", String(filters.withActivePlan));
  if (filters.withActivePackage !== undefined) sp.set("withActivePackage", String(filters.withActivePackage));
  if (filters.lastAccessDays !== undefined) sp.set("lastAccessDays", String(filters.lastAccessDays));
  
  // Nuovi filtri veloci
  if (filters.withoutPlan) sp.set("withoutPlan", "true");
  if (filters.packageToRenew) sp.set("packageToRenew", "true");
  if (filters.withoutAppointment) sp.set("withoutAppointment", "true");
  if (filters.lowActivity) sp.set("lowActivity", "true");
  if (filters.includeArchived) sp.set("includeArchived", "true");
  
  // Nuovi filtri avanzati
  if (filters.planWeeksRange) sp.set("planWeeksRange", filters.planWeeksRange);
  if (filters.packageStatuses) filters.packageStatuses.forEach(s => sp.append("packageStatus", s));
  if (filters.appointmentStatuses) filters.appointmentStatuses.forEach(s => sp.append("appointmentStatus", s));
  if (filters.activityStatuses) filters.activityStatuses.forEach(s => sp.append("activityStatus", s));
  
  return sp;
}
