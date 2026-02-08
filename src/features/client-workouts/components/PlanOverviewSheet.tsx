import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ChevronRight, FileText } from "lucide-react";
import type { ClientActivePlan } from "../api/client-plans.api";
import type { ClientSession } from "../api/client-sessions.api";
import type { Day } from "@/types/plan";
import { countDayExercises } from "../utils/plan-utils";
import { WorkoutDayDetailSheet } from "./WorkoutDayDetailSheet";
import { isThisWeek } from "date-fns";

interface PlanOverviewSheetProps {
  plan: ClientActivePlan | null | undefined;
  sessions: ClientSession[] | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanOverviewSheet({ plan, sessions, open, onOpenChange }: PlanOverviewSheetProps) {
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);

  if (!plan) return null;

  const days = plan.data?.days || [];

  // Get day IDs completed this week
  const completedDayIdsThisWeek = new Set(
    (sessions || [])
      .filter((s) => s.day_id && s.started_at && isThisWeek(new Date(s.started_at)))
      .map((s) => s.day_id!)
  );

  const handleDayClick = (day: Day) => {
    setSelectedDay(day);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader className="text-left pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <SheetTitle className="text-lg">{plan.name}</SheetTitle>
                <p className="text-[15px] leading-6 text-muted-foreground">
                  {days.length} {days.length === 1 ? "giorno" : "giorni"} di allenamento
                </p>
              </div>
            </div>
          </SheetHeader>
          
          <div className="overflow-y-auto flex-1 py-4 space-y-2">
            {days.length === 0 ? (
              <p className="text-[15px] leading-6 text-muted-foreground text-center py-4">
                Il piano non contiene ancora giorni di allenamento
              </p>
            ) : (
              days.map((day) => {
                const isCompleted = completedDayIdsThisWeek.has(day.id);
                const exerciseCount = countDayExercises(day);
                
                return (
                  <Card 
                    key={day.id}
                    className={`shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                      isCompleted ? "bg-primary/5 border-primary/20" : ""
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <span className="text-xs font-medium text-muted-foreground">
                              {day.order}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[15px] leading-6 text-foreground truncate">
                            {day.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {exerciseCount} esercizi
                            {isCompleted && " • Completato"}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      <WorkoutDayDetailSheet
        day={selectedDay}
        open={!!selectedDay}
        onOpenChange={(open) => !open && setSelectedDay(null)}
      />
    </>
  );
}
