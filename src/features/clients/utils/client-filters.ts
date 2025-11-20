import type { ClientWithDetails } from "../types";
import type { QuickFilterType } from "../components/QuickFilters";

export function applyQuickFilters(
  clients: ClientWithDetails[],
  quickFilters: QuickFilterType[]
): ClientWithDetails[] {
  if (!quickFilters || quickFilters.length === 0) {
    return clients;
  }

  return clients.filter((client) => {
    return quickFilters.every((filter) => {
      switch (filter) {
        case "plan_expiring":
          return client.plan_weeks_since_assignment !== null && 
                 client.plan_weeks_since_assignment !== undefined && 
                 client.plan_weeks_since_assignment >= 9;
        
        case "package_low":
          return client.package_status === "low";
        
        case "package_expired":
          return client.package_status === "expired";
        
        case "no_appointments":
          return client.appointment_status === "unplanned";
        
        case "inactive":
          return client.activity_status === "inactive";
        
        default:
          return true;
      }
    });
  });
}

export function applySorting(
  clients: ClientWithDetails[],
  sort: string
): ClientWithDetails[] {
  const sorted = [...clients];

  switch (sort) {
    case "plan_weeks_asc":
      sorted.sort((a, b) => {
        const aVal = a.plan_weeks_since_assignment ?? Infinity;
        const bVal = b.plan_weeks_since_assignment ?? Infinity;
        return aVal - bVal;
      });
      break;
    
    case "plan_weeks_desc":
      sorted.sort((a, b) => {
        const aVal = a.plan_weeks_since_assignment ?? -1;
        const bVal = b.plan_weeks_since_assignment ?? -1;
        return bVal - aVal;
      });
      break;
    
    case "package_status":
      const packageOrder = { expired: 0, low: 1, active: 2, none: 3 };
      sorted.sort((a, b) => {
        const aVal = packageOrder[a.package_status || "none"];
        const bVal = packageOrder[b.package_status || "none"];
        return aVal - bVal;
      });
      break;
    
    case "appointment_status":
      sorted.sort((a, b) => {
        const aVal = a.appointment_status === "unplanned" ? 0 : 1;
        const bVal = b.appointment_status === "unplanned" ? 0 : 1;
        return aVal - bVal;
      });
      break;
    
    case "activity_status":
      const activityOrder = { inactive: 0, low: 1, active: 2 };
      sorted.sort((a, b) => {
        const aVal = activityOrder[a.activity_status || "inactive"];
        const bVal = activityOrder[b.activity_status || "inactive"];
        return aVal - bVal;
      });
      break;
  }

  return sorted;
}
