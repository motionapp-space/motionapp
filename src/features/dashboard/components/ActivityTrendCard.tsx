import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRevenueTrend } from "../hooks/useRevenueTrend";
import { formatCents } from "../hooks/useDashboardKpis";
import { cn } from "@/lib/utils";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg text-sm p-2 shadow-md">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground tabular-nums">
        {formatCents(payload[0].value)}
      </p>
    </div>
  );
}

function LastDot(props: any) {
  const { cx, cy, index, dataLength } = props;
  if (index !== dataLength - 1) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="hsl(var(--accent))"
      stroke="hsl(var(--card))"
      strokeWidth={2}
    />
  );
}

const PERIODS = [
  { label: "6M", value: 6 },
  { label: "12M", value: 12 },
] as const;

export default function ActivityTrendCard() {
  const [months, setMonths] = useState<6 | 12>(6);
  const { data: trend, isLoading } = useRevenueTrend(months);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3 h-full">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  const hasData = trend && trend.data.some((d) => d.amount > 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Andamento ricavi
          </h2>
          {hasData && trend && (
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold tabular-nums text-foreground">
                {formatCents(trend.currentMonth)}
              </span>
              <span className="text-sm text-muted-foreground">questo mese</span>
              {trend.percentChange !== null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-sm font-medium",
                    "text-muted-foreground"
                  )}
                >
                  {trend.percentChange >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {trend.percentChange > 0 ? "+" : ""}
                  {trend.percentChange}% vs mese precedente
                </span>
              )}
            </div>
          )}
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setMonths(p.value)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150",
                months === p.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {hasData ? (
        <div className="h-44 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend!.data}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--accent))"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--accent))"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.4}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fillOpacity: 0.8 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={55}
                tickFormatter={(v) => formatCents(v)}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fillOpacity: 0.7 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--accent))"
                strokeWidth={3}
                fill="url(#areaFill)"
                dot={(props: any) => (
                  <LastDot
                    key={props.index}
                    {...props}
                    dataLength={trend!.data.length}
                  />
                )}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-44 flex flex-col items-center justify-center space-y-1">
          <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">
            Nessun dato disponibile
          </p>
          <p className="text-sm text-muted-foreground">
            I ricavi appariranno qui quando registrerai pagamenti
          </p>
        </div>
      )}
    </div>
  );
}
