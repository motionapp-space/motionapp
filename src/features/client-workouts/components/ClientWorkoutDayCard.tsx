import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ClientWorkoutExerciseList } from "./ClientWorkoutExerciseList";
import type { Day } from "@/types/plan";

interface ClientWorkoutDayCardProps {
  day: Day;
  index: number;
}

export function ClientWorkoutDayCard({ day, index }: ClientWorkoutDayCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Count total exercises
  const totalExercises = day.phases?.reduce((acc, phase) => {
    const groupExercises = phase.groups?.reduce((gAcc, group) => {
      return gAcc + (group.exercises?.length || 0);
    }, 0) || 0;
    return acc + groupExercises;
  }, 0) || 0;

  const title = day.title || `Giorno ${index + 1}`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="py-3 px-4 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalExercises} esercizi
                </p>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 border-t">
            <ClientWorkoutExerciseList day={day} />
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
