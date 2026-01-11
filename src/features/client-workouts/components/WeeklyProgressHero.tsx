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
      <Card className="shadow-sm rounded-2xl">
        <CardContent className="py-8 px-6">
          <div className="flex flex-col items-center">
            <Skeleton className="w-[160px] h-[160px] rounded-full" />
            <Skeleton className="h-7 w-56 mt-5" />
            <Skeleton className="h-4 w-44 mt-2" />
          </div>
          <div className="mt-6 pt-4 border-t">
            <WeeklyDayTimeline weekDays={weekDays} isLoading />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Always use primary blue - completion is not an "end state"
  const progressColor = "hsl(var(--primary))";

  const data = [{ value: percentage, fill: progressColor }];

  // Dynamic copy - coach-driven
  const title = isWeekCompleted 
    ? "Obiettivo settimanale completato" 
    : "Obiettivo settimanale";

  const subtitle = totalDays === 0
    ? "Nessun piano assegnato."
    : isWeekCompleted
    ? `Hai completato ${completedCount} allenament${completedCount === 1 ? 'o' : 'i'} questa settimana.`
    : remainingCount === 1
    ? "Ti manca 1 allenamento."
    : `Ti mancano ${remainingCount} allenamenti.`;

  const hint = isWeekCompleted
    ? "Puoi continuare ad allenarti o rivedere il piano."
    : "Il tuo coach segue i tuoi progressi";

  return (
    <Card className="shadow-sm rounded-2xl">
      <CardContent className="py-8 px-6">
        {/* Centered vertical layout */}
        <div className="flex flex-col items-center text-center">
          {/* Large Donut - focal point */}
          <div 
            className="relative animate-scale-in" 
            style={{ width: CHART_SIZE, height: CHART_SIZE }}
          >
            <RadialBarChart
              width={CHART_SIZE}
              height={CHART_SIZE}
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              innerRadius={CHART_SIZE * 0.38}
              outerRadius={CHART_SIZE * 0.50}
              barSize={18}
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
                cornerRadius={9}
              />
            </RadialBarChart>

            {/* Center text - large and bold */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-foreground leading-none">
                {completedCount}/{totalDays}
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                allenamenti
              </span>
            </div>
          </div>

          {/* Hero text - below donut */}
          <h2 className="text-xl font-semibold text-foreground mt-5">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-3">
            {hint}
          </p>
        </div>

        {/* Compact timeline */}
        <div className="mt-6 pt-4 border-t">
          <WeeklyDayTimeline weekDays={weekDays} />
        </div>
      </CardContent>
    </Card>
  );
}
