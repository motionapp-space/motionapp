import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { endOfTodayUTC, startWindow7dUTC, startWindow30dUTC, startWindow12mUTC } from "../utils/time";

interface ClientTrendChartProps {
  data: { date: number; count: number }[];
}

type TimeRange = "7d" | "30d" | "12m";

type ChartPoint = { ts: number; value: number };

export function ClientTrendChart({ data }: ClientTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Normalize data to UTC timestamps
  const normalized: ChartPoint[] = useMemo(() => 
    data
      .map(d => ({ ts: d.date, value: d.count }))
      .sort((a, b) => a.ts - b.ts)
  , [data]);

  // Calculate domain based on range (UTC, inclusive)
  const domainX: [number, number] = useMemo(() => {
    const end = endOfTodayUTC();
    if (timeRange === "7d") return [startWindow7dUTC(), end];
    if (timeRange === "12m") return [startWindow12mUTC(), end];
    return [startWindow30dUTC(), end]; // 30d
  }, [timeRange]);

  // Filter data for current range
  const filteredData = useMemo(() => {
    const [minX, maxX] = domainX;
    const f = normalized.filter(p => p.ts >= minX && p.ts <= maxX);
    // Show empty chart with sentinel points if no data
    return f.length ? f : [{ ts: minX, value: 0 }, { ts: maxX, value: 0 }];
  }, [normalized, domainX]);

  const latestCount = filteredData[filteredData.length - 1]?.value || 0;
  const firstCount = filteredData[0]?.value || 0;
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
              dataKey="ts"
              type="number"
              scale="time"
              domain={domainX}
              tickCount={6}
              tickFormatter={(ts) => {
                const d = new Date(ts);
                return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
              }}
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
              labelFormatter={(ts) => {
                const d = new Date(Number(ts));
                return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
              }}
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
              dataKey="value"
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
