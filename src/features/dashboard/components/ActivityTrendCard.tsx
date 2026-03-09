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

export default function ActivityTrendCard() {
  const { data: trend, isLoading } = useRevenueTrend();

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const hasData = trend && trend.data.some((d) => d.amount > 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Andamento attività
        </h2>
        {hasData && trend && (
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {formatCents(trend.currentMonth)}
            </span>
            <span className="text-sm text-muted-foreground">questo mese</span>
            {trend.percentChange !== null && (
              <span
                className={`inline-flex items-center gap-0.5 text-sm font-medium ${
                  trend.percentChange >= 0 ? "text-accent" : "text-destructive"
                }`}
              >
                {trend.percentChange >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {trend.percentChange > 0 ? "+" : ""}
                {trend.percentChange}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      {hasData ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend!.data}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--accent))"
                    stopOpacity={0.1}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--accent))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--accent))"
                strokeWidth={2.5}
                fill="url(#areaFill)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex flex-col items-center justify-center space-y-1">
          <BarChart3 className="h-8 w-8 text-muted-foreground/60" />
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
