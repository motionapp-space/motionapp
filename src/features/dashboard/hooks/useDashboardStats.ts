import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, startOfDay, subMonths, eachDayOfInterval } from "date-fns";

interface DashboardStats {
  nonArchivedClients: number;
  nonArchivedClientsChange: number;
  newClients: number;
  newClientsChange: number;
  archivedClients: number;
  archivedClientsChange: number;
  totalClients: number;
  totalClientsChange: number;
  trendData: { date: number; count: number }[];
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = startOfDay(currentMonthStart);

  // Get coach_clients with status for this coach
  const { data: ccData, error: ccError } = await supabase
    .from("coach_clients")
    .select("client_id, status")
    .eq("coach_id", user.id);

  if (ccError) throw ccError;
  
  const clientIds = ccData?.map(cc => cc.client_id) || [];
  
  // Build set of archived client IDs (relation-centric model)
  const archivedClientIds = new Set(
    ccData?.filter(cc => cc.status === 'archived').map(cc => cc.client_id) || []
  );
  
  if (clientIds.length === 0) {
    return {
      nonArchivedClients: 0,
      nonArchivedClientsChange: 0,
      newClients: 0,
      newClientsChange: 0,
      archivedClients: 0,
      archivedClientsChange: 0,
      totalClients: 0,
      totalClientsChange: 0,
      trendData: []
    };
  }

  // Fetch all clients for this coach
  const { data: allClients, error: allError } = await supabase
    .from("clients")
    .select("id, created_at")
    .in("id", clientIds);

  if (allError) throw allError;

  const clients = allClients || [];

  // Current stats using relation-centric model
  const nonArchivedClients = clients.filter(c => !archivedClientIds.has(c.id)).length;
  const archivedClients = clients.filter(c => archivedClientIds.has(c.id)).length;
  const totalClients = clients.length;
  const newClients = clients.filter(c => new Date(c.created_at) >= currentMonthStart).length;

  // Previous month stats for comparison
  const { data: prevMonthClients, error: prevError } = await supabase
    .from("clients")
    .select("id, created_at")
    .in("id", clientIds)
    .lt("created_at", currentMonthStart.toISOString());

  if (prevError) throw prevError;

  const prevClients = prevMonthClients || [];
  // For previous stats, we use current archived status as approximation
  const prevNonArchivedClients = prevClients.filter(c => !archivedClientIds.has(c.id)).length;
  const prevArchivedClients = prevClients.filter(c => archivedClientIds.has(c.id)).length;
  const prevTotalClients = prevClients.length;
  
  const prevNewClients = prevClients.filter(c => {
    const createdAt = new Date(c.created_at);
    return createdAt >= previousMonthStart && createdAt < previousMonthEnd;
  }).length;

  // Calculate percentage changes
  const nonArchivedClientsChange = prevNonArchivedClients > 0 
    ? ((nonArchivedClients - prevNonArchivedClients) / prevNonArchivedClients) * 100 
    : (nonArchivedClients > 0 ? 100 : 0);
  
  const newClientsChange = prevNewClients > 0 
    ? ((newClients - prevNewClients) / prevNewClients) * 100 
    : (newClients > 0 ? 100 : 0);
  
  const archivedClientsChange = prevArchivedClients > 0 
    ? ((archivedClients - prevArchivedClients) / prevArchivedClients) * 100 
    : (archivedClients > 0 ? 100 : 0);
  
  const totalClientsChange = prevTotalClients > 0 
    ? ((totalClients - prevTotalClients) / prevTotalClients) * 100 
    : (totalClients > 0 ? 100 : 0);

  // Generate trend data for the last 12 months (UTC normalized)
  const twelveMonthsAgo = subMonths(now, 12);
  const days = eachDayOfInterval({ start: twelveMonthsAgo, end: now });
  
  const trendData = days.map(day => {
    const dayEnd = startOfDay(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    const count = clients.filter(c => new Date(c.created_at) <= dayEnd).length;
    
    const ts = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999).getTime();
    
    return {
      date: ts,
      count
    };
  });

  return {
    nonArchivedClients,
    nonArchivedClientsChange,
    newClients,
    newClientsChange,
    archivedClients,
    archivedClientsChange,
    totalClients,
    totalClientsChange,
    trendData
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
    refetchOnMount: 'always',
    staleTime: 0,
  });
}
