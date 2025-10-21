import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, startOfDay, subMonths, eachDayOfInterval, format } from "date-fns";

interface DashboardStats {
  activeClients: number;
  activeClientsChange: number;
  newClients: number;
  newClientsChange: number;
  terminatedClients: number;
  terminatedClientsChange: number;
  totalClients: number;
  totalClientsChange: number;
  trendData: { date: string; count: number }[];
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = startOfDay(currentMonthStart);

  // Fetch all clients
  const { data: allClients, error: allError } = await supabase
    .from("clients")
    .select("id, status, created_at")
    .eq("coach_id", user.id);

  if (allError) throw allError;

  const clients = allClients || [];

  // Current month stats
  const activeClients = clients.filter(c => c.status === "ATTIVO").length;
  const terminatedClients = clients.filter(c => c.status === "SOSPESO" || c.status === "ARCHIVIATO").length;
  const totalClients = clients.length;
  const newClients = clients.filter(c => new Date(c.created_at) >= currentMonthStart).length;

  // Previous month stats for comparison
  const { data: prevMonthClients, error: prevError } = await supabase
    .from("clients")
    .select("id, status, created_at")
    .eq("coach_id", user.id)
    .lt("created_at", currentMonthStart.toISOString());

  if (prevError) throw prevError;

  const prevClients = prevMonthClients || [];
  const prevActiveClients = prevClients.filter(c => c.status === "ATTIVO").length;
  const prevTerminatedClients = prevClients.filter(c => c.status === "SOSPESO" || c.status === "ARCHIVIATO").length;
  const prevTotalClients = prevClients.length;
  
  const prevNewClients = prevClients.filter(c => {
    const createdAt = new Date(c.created_at);
    return createdAt >= previousMonthStart && createdAt < previousMonthEnd;
  }).length;

  // Calculate percentage changes
  const activeClientsChange = prevActiveClients > 0 
    ? ((activeClients - prevActiveClients) / prevActiveClients) * 100 
    : (activeClients > 0 ? 100 : 0);
  
  const newClientsChange = prevNewClients > 0 
    ? ((newClients - prevNewClients) / prevNewClients) * 100 
    : (newClients > 0 ? 100 : 0);
  
  const terminatedClientsChange = prevTerminatedClients > 0 
    ? ((terminatedClients - prevTerminatedClients) / prevTerminatedClients) * 100 
    : (terminatedClients > 0 ? 100 : 0);
  
  const totalClientsChange = prevTotalClients > 0 
    ? ((totalClients - prevTotalClients) / prevTotalClients) * 100 
    : (totalClients > 0 ? 100 : 0);

  // Generate trend data for the last 12 months
  const twelveMonthsAgo = subMonths(now, 12);
  const days = eachDayOfInterval({ start: twelveMonthsAgo, end: now });
  
  const trendData = days.map(day => {
    const dayEnd = startOfDay(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    const count = clients.filter(c => new Date(c.created_at) <= dayEnd).length;
    
    return {
      date: day.toISOString(),
      count
    };
  });

  return {
    activeClients,
    activeClientsChange,
    newClients,
    newClientsChange,
    terminatedClients,
    terminatedClientsChange,
    totalClients,
    totalClientsChange,
    trendData
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
