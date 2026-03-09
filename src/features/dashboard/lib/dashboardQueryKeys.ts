export const dashboardQueryKeys = {
  all: () => ["dashboard"] as const,

  todayEvents: () => ["dashboard", "todayEvents"] as const,
  pendingActions: () => ["dashboard", "pendingActions"] as const,
  revenueTrend: () => ["dashboard", "revenueTrend"] as const,
  inactiveClients: () => ["dashboard", "inactiveClients"] as const,
  clientsLowSessions: () => ["dashboard", "clientsLowSessions"] as const,

  stats: () => ["dashboardStats"] as const,
};
