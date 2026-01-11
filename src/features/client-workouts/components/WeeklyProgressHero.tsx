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

const CHART_SIZE = 160;
const INNER_RADIUS = CHART_SIZE * 0.38;
const OUTER_RADIUS = CHART_SIZE * 0.52;

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
      <Card className="shadow-md rounded-2xl">
        <CardContent className="py-8 px-6">
          <div className="flex flex-col items-center">
            <Skeleton className="w-[160px] h-[160px] rounded-full" />
            <Skeleton className="h-5 w-56 mt-4" />
          </div>
          <div className="mt-5 pt-4 border-t">
            <WeeklyDayTimeline weekDays={weekDays} isLoading />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Always use primary blue
  const progressColor = "hsl(var(--primary))";
  const data = [{ value: percentage, fill: progressColor }];

  // Shorter, coach-driven copy
  const title = "Obiettivo settimanale";

  // Concise subtitle
  const subtitle = totalDays === 0
    ? "Nessun piano assegnato."
    : `${completedCount} allenament${completedCount === 1 ? 'o completato' : 'i completati'} questa settimana.`;

  // Dynamic label inside donut (singular/plural)
  const donutLabel = completedCount === 1 ? "allenamento" : "allenamenti";

  return (
    <Card className="shadow-md rounded-2xl">
      <CardContent className="py-6 px-6">
        {/* Centered vertical layout - tighter spacing */}
        <div className="flex flex-col items-center text-center">
          {/* Donut with depth and visible background ring */}
          <div 
            className="relative animate-scale-in" 
            style={{ width: CHART_SIZE, height: CHART_SIZE }}
          >
            <RadialBarChart
              width={CHART_SIZE}
              height={CHART_SIZE}
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              innerRadius={INNER_RADIUS}
              outerRadius={OUTER_RADIUS}
              barSize={22}
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
                background={{ fill: "hsl(var(--primary) / 0.15)" }}
                dataKey="value"
                cornerRadius={11}
              />
            </RadialBarChart>

            {/* Center text - better separation */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <span className="text-3xl font-semibold text-foreground leading-none">
                {completedCount}/{totalDays}
              </span>
              <span className="text-xs text-muted-foreground mt-1.5">
                {donutLabel}
              </span>
            </div>
          </div>

          {/* Hero text - tighter to donut */}
          <h2 className="text-lg font-semibold text-foreground mt-3">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        </div>

        {/* Timeline with breathing room from hero */}
        <div className="mt-6 pt-4 border-t">
          <WeeklyDayTimeline weekDays={weekDays} />
        </div>
      </CardContent>
    </Card>
  );
}
