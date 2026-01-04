import { Day, PhaseType, Exercise, ExerciseGroup, GroupType } from "@/types/plan";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { PhaseSectionCompact } from "./PhaseSectionCompact";
import { DraggableHandle } from "./DraggableHandle";
import { useState, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DayCardCompactProps {
  day: Day;
  onUpdateTitle: (title: string) => void;
  onUpdateObjective?: (objective: string) => void;
  onUpdatePhaseObjective?: (phaseType: PhaseType, objective: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddGroup: (phaseType: PhaseType, groupType: GroupType) => void;
  onUpdateGroup: (phaseType: PhaseType, groupId: string, updates: Partial<ExerciseGroup>) => void;
  onDuplicateGroup: (phaseType: PhaseType, groupId: string) => void;
  onDeleteGroup: (phaseType: PhaseType, groupId: string) => void;
  onAddExerciseToGroup: (phaseType: PhaseType, groupId: string) => void;
  onUpdateExercise: (phaseType: PhaseType, groupId: string, exerciseId: string, patch: Partial<Exercise>) => void;
  onDuplicateExercise: (phaseType: PhaseType, groupId: string, exerciseId: string) => void;
  onDeleteExercise: (phaseType: PhaseType, groupId: string, exerciseId: string) => void;
  readonly?: boolean;
  dragHandleProps?: any;
}

export const DayCardCompact = ({
  day,
  onUpdateTitle,
  onUpdateObjective,
  onUpdatePhaseObjective,
  onDuplicate,
  onDelete,
  onAddGroup,
  onUpdateGroup,
  onDuplicateGroup,
  onDeleteGroup,
  onAddExerciseToGroup,
  onUpdateExercise,
  onDuplicateExercise,
  onDeleteExercise,
  readonly = false,
  dragHandleProps,
}: DayCardCompactProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate summary stats
  const summary = useMemo(() => {
    const exercises = day.phases.reduce(
      (sum, p) =>
        sum + (p.groups?.reduce((gSum, g) => gSum + g.exercises.length, 0) || 0),
      0
    );
    // Rough estimation: 2 min per exercise
    const estimatedMinutes = Math.max(1, exercises * 2);
    return { exercises, estimatedMinutes };
  }, [day.phases]);

  return (
    <div className="border-b border-border">
      {/* Day Header - Flat style */}
      <div className="flex items-center gap-3 py-3 px-2">
        <DraggableHandle
          level="day"
          disabled={readonly}
          dragHandleProps={dragHandleProps}
        />

        <Input
          value={day.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="font-semibold text-base h-auto py-1 px-2 border-0 bg-transparent hover:bg-muted/30 focus:bg-muted/30 transition-colors max-w-[180px]"
          disabled={readonly}
          placeholder="Nome del giorno"
          aria-label="Nome del giorno"
        />

        {summary.exercises > 0 && (
          <span className="text-xs text-muted-foreground/60">
            {summary.exercises} es. · ~{summary.estimatedMinutes} min
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 text-sm">
          {!readonly && (
            <>
              <button
                onClick={onDuplicate}
                className="text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
              >
                Duplica
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-muted-foreground hover:text-destructive px-2 py-1 transition-colors">
                    Elimina
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare questo giorno?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tutti i blocchi e gli esercizi verranno eliminati.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>Elimina</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted/50 rounded transition-colors"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Comprimi giorno" : "Espandi giorno"}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Day Content */}
      {isExpanded && (
        <div className="pb-4 px-2">
          {/* Day Objective */}
          {(day.objective || !readonly) && onUpdateObjective && (
            <div className="flex flex-col gap-1.5 pl-8 mt-4">
              <Label
                htmlFor={`day-objective-${day.id}`}
                className="text-xs font-medium text-muted-foreground"
              >
                Obiettivo del giorno
              </Label>
              <div className="relative">
                <Textarea
                  id={`day-objective-${day.id}`}
                  value={day.objective || ""}
                  onChange={(e) => onUpdateObjective(e.target.value.slice(0, 120))}
                  placeholder="Descrivi l'obiettivo di questo giorno..."
                  maxLength={120}
                  rows={2}
                  disabled={readonly}
                  className="resize-none pr-14 text-sm min-h-[60px] border-0 bg-muted/30 focus:bg-muted/50"
                />
                <div className="absolute bottom-2 right-3 text-xs text-muted-foreground/60">
                  {(day.objective || "").length}/120
                </div>
              </div>
            </div>
          )}

          {/* Phases */}
          <div className="pl-8">
            {day.phases.map((phase, index) => (
              <div key={phase.id} className={index === 0 ? "mt-4" : "mt-6"}>
              <PhaseSectionCompact
                phase={phase}
                onAddGroup={(type) => onAddGroup(phase.type, type)}
                onUpdateGroup={(groupId, updates) =>
                  onUpdateGroup(phase.type, groupId, updates)
                }
                onDuplicateGroup={(groupId) => onDuplicateGroup(phase.type, groupId)}
                onDeleteGroup={(groupId) => onDeleteGroup(phase.type, groupId)}
                onAddExerciseToGroup={(groupId) =>
                  onAddExerciseToGroup(phase.type, groupId)
                }
                onUpdateExercise={(groupId, exerciseId, patch) =>
                  onUpdateExercise(phase.type, groupId, exerciseId, patch)
                }
                onDuplicateExercise={(groupId, exerciseId) =>
                  onDuplicateExercise(phase.type, groupId, exerciseId)
                }
                onDeleteExercise={(groupId, exerciseId) =>
                  onDeleteExercise(phase.type, groupId, exerciseId)
                }
                onUpdatePhaseObjective={
                  onUpdatePhaseObjective
                    ? (objective) => onUpdatePhaseObjective(phase.type, objective)
                    : undefined
                }
                readonly={readonly}
              />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
