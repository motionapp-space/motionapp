import { Day, PhaseType, Exercise, ExerciseGroup, GroupType } from "@/types/plan";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Copy, Trash2, ChevronDown, Clock } from "lucide-react";
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
    const blocks = day.phases.filter(p => p.groups && p.groups.length > 0).length;
    const exercises = day.phases.reduce((sum, p) => 
      sum + (p.groups?.reduce((gSum, g) => gSum + g.exercises.length, 0) || 0), 0
    );
    // Rough estimation: 2 min per exercise + 1 min per block
    const estimatedMinutes = Math.max(1, exercises * 2 + blocks);
    return { blocks, exercises, estimatedMinutes };
  }, [day.phases]);

  return (
    <Card
      className="overflow-visible border-2 transition-all"
    >
      <CardHeader className="p-4 bg-muted/30">
        <div className="flex items-center gap-3">
          <DraggableHandle
            level="day"
            disabled={readonly}
            dragHandleProps={dragHandleProps}
          />

          {/* Day Title and Summary */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                value={day.title}
                onChange={(e) => onUpdateTitle(e.target.value)}
                className="font-semibold text-base h-auto py-1 px-2 border-0 bg-transparent hover:bg-background/50 focus:bg-background transition-colors max-w-xs"
                disabled={readonly}
                placeholder="Nome del giorno"
                aria-label="Nome del giorno"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-primary/20">
                  {summary.blocks} blocc{summary.blocks === 1 ? "o" : "hi"}
                </Badge>
                <Badge variant="secondary" className="text-xs font-medium bg-secondary/10 text-secondary-foreground border-secondary/20">
                  {summary.exercises} eserciz{summary.exercises === 1 ? "io" : "i"}
                </Badge>
                {summary.estimatedMinutes > 0 && (
                  <Badge variant="outline" className="text-xs font-medium gap-1">
                    <Clock className="h-4 w-4" />
                    ~{summary.estimatedMinutes} min
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-9 w-9"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Comprimi giorno" : "Espandi giorno"}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </Button>
            {!readonly && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDuplicate}
                  title="Duplica giorno"
                  className="h-9 w-9"
                  aria-label="Duplica giorno"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      title="Elimina giorno"
                      aria-label="Elimina giorno"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-6 pt-4 space-y-8">
          {/* Day Objective */}
          {(day.objective || !readonly) && onUpdateObjective && (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`day-objective-${day.id}`} className="text-sm font-semibold text-foreground">
                Obiettivo del giorno
              </Label>
              <div className="relative">
                <Textarea
                  id={`day-objective-${day.id}`}
                  value={day.objective || ""}
                  onChange={(e) =>
                    onUpdateObjective(e.target.value.slice(0, 120))
                  }
                  placeholder="Descrivi l'obiettivo di questo giorno (max 120 caratteri)…"
                  maxLength={120}
                  aria-describedby={`day-objective-count-${day.id}`}
                  rows={2}
                  disabled={readonly}
                  className="resize-none pr-16 text-sm"
                />
                <div
                  id={`day-objective-count-${day.id}`}
                  className="absolute bottom-2 right-3 text-xs text-muted-foreground select-none pointer-events-none"
                >
                  {(day.objective || "").length}/120
                </div>
              </div>
            </div>
          )}

          {/* Blocks (Phases) */}
          <div className="space-y-8">
            {day.phases.map((phase) => (
              <PhaseSectionCompact
                key={phase.id}
                phase={phase}
                onAddGroup={(type) => onAddGroup(phase.type, type)}
                onUpdateGroup={(groupId, updates) => onUpdateGroup(phase.type, groupId, updates)}
                onDuplicateGroup={(groupId) => onDuplicateGroup(phase.type, groupId)}
                onDeleteGroup={(groupId) => onDeleteGroup(phase.type, groupId)}
                onAddExerciseToGroup={(groupId) => onAddExerciseToGroup(phase.type, groupId)}
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
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
