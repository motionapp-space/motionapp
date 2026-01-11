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

const CHART_SIZE = 120;

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
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Skeleton className="w-[120px] h-[120px] rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="w-full pt-4 mt-4 border-t">
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

  // Dynamic title
  const title = isWeekCompleted 
    ? "Settimana completata ✅" 
    : "Obiettivo settimanale";

  // Dynamic subtitle
  const subtitle = totalDays === 0
    ? "Il tuo coach non ha ancora assegnato un piano"
    : isWeekCompleted
    ? "Hai raggiunto l'obiettivo. Continua così."
    : remainingCount === 1
    ? "Ti manca 1 allenamento per completarla."
    : `Ti mancano ${remainingCount} allenamenti per completarla.`;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        {/* Horizontal layout: Donut left, Text right */}
        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <div className="relative animate-scale-in flex-shrink-0" style={{ width: CHART_SIZE, height: CHART_SIZE }}>
            <RadialBarChart
              width={CHART_SIZE}
              height={CHART_SIZE}
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              innerRadius={CHART_SIZE * 0.35}
              outerRadius={CHART_SIZE * 0.48}
              barSize={10}
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
                cornerRadius={5}
              />
            </RadialBarChart>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">
                {completedCount}/{totalDays}
              </span>
              <span className="text-[10px] text-muted-foreground">
                allenamenti
              </span>
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground leading-tight">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              Il tuo coach vede i tuoi progressi
            </p>
          </div>
        </div>

        {/* Timeline - Footer of hero card */}
        <div className="w-full pt-4 mt-4 border-t">
          <WeeklyDayTimeline weekDays={weekDays} />
        </div>
      </CardContent>
    </Card>
  );
}
