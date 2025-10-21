import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { subDays, subMonths, startOfDay } from "date-fns";

interface ClientTrendChartProps {
  data: { date: string; count: number }[];
}

type TimeRange = "7d" | "30d" | "12m";
type Point = { ts: number; value: number };

function getStart(range: TimeRange) {
  const now = new Date();
  if (range === "7d") return subDays(now, 7);
  if (range === "30d") return subDays(now, 30);
  return subMonths(now, 12);
}

export function ClientTrendChart({ data }: ClientTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Normalize to numeric timestamps
  const normalized: Point[] = useMemo(
    () =>
      data
        .map(d => {
          const dt = new Date(d.date);
          return { ts: startOfDay(dt).getTime(), value: d.count };
        })
        .sort((a, b) => a.ts - b.ts),
    [data]
  );

  const { filtered, domain } = useMemo(() => {
    const now = startOfDay(new Date()).getTime();
    const start = startOfDay(getStart(timeRange)).getTime();
    const f = normalized.filter(p => p.ts >= start && p.ts <= now);
    const safe = f.length ? f : [{ ts: now, value: 0 }];
    return { filtered: safe, domain: [start, now] as [number, number] };
  }, [normalized, timeRange]);

  const latestCount = filtered[filtered.length - 1]?.value || 0;
  const firstCount = filtered[0]?.value || 0;
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
        <AreaChart 
          data={filtered}
          key={timeRange}
          margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
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
            domain={domain}
            tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
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
            labelFormatter={(ts) => new Date(Number(ts)).toLocaleDateString()}
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
  );
}
