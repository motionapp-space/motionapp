import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { subDays, subMonths, format } from "date-fns";

interface ClientTrendChartProps {
  data: { date: string; count: number }[];
}

type TimeRange = "7d" | "30d" | "12m";

export function ClientTrendChart({ data }: ClientTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Calculate start date based on range
  const getStartDate = (range: TimeRange) => {
    const now = new Date();
    if (range === "7d") return subDays(now, 7);
    if (range === "30d") return subDays(now, 30);
    return subMonths(now, 12);
  };

  // Filter data based on selected range
  const filteredData = useMemo(() => {
    const start = getStartDate(timeRange);
    return data.filter((d) => new Date(d.date) >= start);
  }, [data, timeRange]);

  const latestCount = filteredData[filteredData.length - 1]?.count || 0;
  const firstCount = filteredData[0]?.count || 0;
  const totalChange = firstCount > 0 
    ? ((latestCount - firstCount) / firstCount) * 100 
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Totale clienti</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">{latestCount}</p>
            <span className={`text-sm font-medium ${totalChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totalChange >= 0 ? "+" : ""}{totalChange.toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={timeRange === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("7d")}
          >
            7g
          </Button>
          <Button
            variant={timeRange === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("30d")}
          >
            30g
          </Button>
          <Button
            variant={timeRange === "12m" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("12m")}
          >
            12m
          </Button>
        </div>
      </div>

      <div className="h-[300px]" data-testid="clients-trend-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            key={timeRange}
            data={filteredData}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis 
              dataKey="date"
              tickFormatter={(value) => format(new Date(value), "dd/MM")}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickMargin={8}
            />
            <YAxis 
              allowDecimals={false}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              labelFormatter={(value) => format(new Date(value), "dd MMM yyyy")}
              formatter={(v: number) => [v, "Clienti"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorCount)"
              name="Clienti"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
