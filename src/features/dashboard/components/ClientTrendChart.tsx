import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ClientTrendChartProps {
  data: { date: string; count: number }[];
}

type TimeRange = "7d" | "30d" | "12m";

export function ClientTrendChart({ data }: ClientTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // For now, we're showing the 30-day data passed from the hook
  // In a real implementation, you'd filter based on timeRange
  const displayData = data;

  const latestCount = displayData[displayData.length - 1]?.count || 0;
  const firstCount = displayData[0]?.count || 0;
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

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={displayData}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
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
  );
}
