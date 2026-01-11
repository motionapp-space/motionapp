import { useState } from "react";
import { Check, ChevronDown, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface PlanDay {
  id: string;
  title: string;
  exercisesCount: number;
  isCompletedThisWeek: boolean;
}

interface ActivePlanCollapsibleProps {
  planName: string;
  daysCount: number;
  days: PlanDay[];
  isLoading: boolean;
  onDayClick?: (dayId: string) => void;
}

export function ActivePlanCollapsible({
  planName,
  daysCount,
  days,
  isLoading,
  onDayClick,
}: ActivePlanCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <section>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          Piano attivo
        </p>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!planName || daysCount === 0) {
    return null;
  }

  return (
    <section>
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">
        Piano attivo
      </p>

      <Card className="shadow-sm rounded-2xl">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardContent className="p-4 cursor-pointer">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">
                    {planName}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {daysCount} allenamenti/settimana
                  </p>
                </div>

                {/* Chevron */}
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            </CardContent>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t px-4 pb-4 pt-3">
              <ul className="space-y-2">
                {days.map((day, index) => (
                  <li key={day.id}>
                    <button
                      onClick={() => onDayClick?.(day.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                    >
                      {/* Status indicator */}
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
                          day.isCompletedThisWeek
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {day.isCompletedThisWeek ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        ) : (
                          index + 1
                        )}
                      </div>

                      {/* Day info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {day.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {day.exercisesCount} esercizi
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </section>
  );
}
