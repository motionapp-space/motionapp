import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subMonths, startOfMonth, format } from "date-fns";

interface MonthData {
  month: string;
  amount: number;
}

interface RevenueTrend {
  data: MonthData[];
  currentMonth: number;
  previousMonth: number;
  percentChange: number | null;
}

const MONTH_LABELS: Record<string, string> = {
  "01": "Gen", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "Mag", "06": "Giu", "07": "Lug", "08": "Ago",
  "09": "Set", "10": "Ott", "11": "Nov", "12": "Dic",
};

async function fetchRevenueTrend(userId: string, months: number): Promise<RevenueTrend> {
  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, months - 1));

  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("coach_id", userId);

  if (!coachClients?.length) {
    return { data: [], currentMonth: 0, previousMonth: 0, percentChange: null };
  }

  const ccIds = coachClients.map((cc) => cc.id);

  const { data: orders } = await supabase
    .from("orders")
    .select("paid_amount_cents, paid_at")
    .in("coach_client_id", ccIds)
    .not("paid_at", "is", null)
    .gte("paid_at", rangeStart.toISOString());

  const monthMap = new Map<string, number>();

  for (let i = months - 1; i >= 0; i--) {
    const m = subMonths(now, i);
    const key = format(m, "yyyy-MM");
    monthMap.set(key, 0);
  }

  orders?.forEach((o) => {
    if (o.paid_at) {
      const key = format(new Date(o.paid_at), "yyyy-MM");
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + o.paid_amount_cents);
      }
    }
  });

  const data: MonthData[] = Array.from(monthMap.entries()).map(([key, amount]) => ({
    month: MONTH_LABELS[key.split("-")[1]] || key,
    amount,
  }));

  const currentMonth = data[data.length - 1]?.amount ?? 0;
  const previousMonth = data[data.length - 2]?.amount ?? 0;
  const percentChange =
    previousMonth > 0
      ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
      : null;

  return { data, currentMonth, previousMonth, percentChange };
}

export function useRevenueTrend(months: number = 6) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "revenueTrend", userId, months],
    queryFn: () => fetchRevenueTrend(userId!, months),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
