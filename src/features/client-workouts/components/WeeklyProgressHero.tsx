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

export function WeeklyProgressHero({
  completedCount,
  totalDays,
  remainingCount,
  percentage,
  isWeekCompleted,
  weekDays,
  isLoading,
}: WeeklyProgressHeroProps) {
  // Responsive chart size
  const chartSize = 120;

  if (isLoading) {
    return (
      <Card className="shadow-sm rounded-2xl">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-[120px] h-[120px] rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-36 mt-2" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <WeeklyDayTimeline weekDays={weekDays} isLoading />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use DS tokens for colors
  const progressColor = isWeekCompleted 
    ? "hsl(var(--chart-2))" // success/green from DS
    : "hsl(var(--primary))";

  const data = [{ value: percentage, fill: progressColor }];

  // Dynamic title
  const title = isWeekCompleted 
    ? "Settimana completata ✅" 
    : "Obiettivo settimanale";

  // Dynamic subtitle
  const subtitle = totalDays === 0
    ? "Il tuo coach non ha ancora assegnato un piano."
    : isWeekCompleted
    ? "Hai raggiunto l'obiettivo. Continua così."
    : remainingCount === 1
    ? "Ti manca 1 allenamento per completarlo."
    : `Ti mancano ${remainingCount} allenamenti per completarlo.`;

  return (
    <Card className="shadow-sm rounded-2xl">
      <CardContent className="p-5 sm:p-6">
        {/* Horizontal layout: Donut left, Text right */}
        <div className="flex items-center gap-4">
          {/* Donut Chart */}
          <div 
            className="relative flex-shrink-0 animate-scale-in" 
            style={{ width: chartSize, height: chartSize }}
          >
            <RadialBarChart
              width={chartSize}
              height={chartSize}
              cx={chartSize / 2}
              cy={chartSize / 2}
              innerRadius={chartSize * 0.36}
              outerRadius={chartSize * 0.50}
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
              <span className="text-2xl font-semibold text-foreground">
                {completedCount}/{totalDays}
              </span>
              <span className="text-xs text-muted-foreground">
                allenamenti
              </span>
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground leading-tight">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-snug">
              {subtitle}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Il tuo coach vede i tuoi progressi
            </p>
          </div>
        </div>

        {/* Timeline - Footer of hero card */}
        <div className="mt-4 pt-4 border-t">
          <WeeklyDayTimeline weekDays={weekDays} />
        </div>
      </CardContent>
    </Card>
  );
}
