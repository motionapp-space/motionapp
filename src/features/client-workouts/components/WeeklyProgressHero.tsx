import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { WeeklyDayTimeline } from "./WeeklyDayTimeline";
import type { WeekDay } from "../hooks/useWeeklyProgress";

interface WeeklyProgressHeroProps {
  completedCount: number;
  totalDays: number;
  remainingCount: number;
  percentage: number;
  isWeekCompleted: boolean;
  weekDays: WeekDay[];
  isLoading: boolean;
}

const CHART_SIZE = 140;

export function WeeklyProgressHero({
  completedCount,
  totalDays,
  remainingCount,
  percentage,
  isWeekCompleted,
  weekDays,
  isLoading,
}: WeeklyProgressHeroProps) {
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <Skeleton className="w-[140px] h-[140px] rounded-full" />
          <Skeleton className="h-4 w-48" />
          <div className="w-full pt-2">
            <WeeklyDayTimeline weekDays={weekDays} isLoading />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Color based on completion state
  const progressColor = isWeekCompleted 
    ? "hsl(142, 71%, 45%)" // green-500
    : "hsl(var(--primary))";

  const data = [{ value: percentage, fill: progressColor }];

  // Microcopy
  const microcopy = totalDays === 0
    ? "Il tuo coach non ha ancora assegnato un piano"
    : isWeekCompleted
    ? "Obiettivo settimanale completato 🎉"
    : remainingCount === 1
    ? "Ti manca 1 allenamento per completare la settimana"
    : `Ti mancano ${remainingCount} allenamenti per completare la settimana`;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6 flex flex-col items-center gap-4">
        {/* Donut Chart */}
        <div className="relative animate-scale-in" style={{ width: CHART_SIZE, height: CHART_SIZE }}>
          <RadialBarChart
            width={CHART_SIZE}
            height={CHART_SIZE}
            cx={CHART_SIZE / 2}
            cy={CHART_SIZE / 2}
            innerRadius={CHART_SIZE * 0.35}
            outerRadius={CHART_SIZE * 0.48}
            barSize={12}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "hsl(var(--muted))" }}
              dataKey="value"
              cornerRadius={6}
            />
          </RadialBarChart>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">
              {completedCount}/{totalDays}
            </span>
            <span className="text-xs text-muted-foreground">
              allenamenti
            </span>
          </div>
        </div>

        {/* Microcopy */}
        <p className="text-sm text-center text-muted-foreground max-w-xs">
          {microcopy}
        </p>

        {/* Timeline */}
        <div className="w-full pt-2 border-t">
          <WeeklyDayTimeline weekDays={weekDays} />
        </div>
      </CardContent>
    </Card>
  );
}
