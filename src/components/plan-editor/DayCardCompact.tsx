import { Day, PhaseType, Exercise, ExerciseGroup, GroupType } from "@/types/plan";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, ChevronDown } from "lucide-react";
import { PhaseSectionCompact } from "./PhaseSectionCompact";
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
}: DayCardCompactProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate summary stats
  const summary = useMemo(() => {
    const blocks = day.phases.filter(p => p.groups && p.groups.length > 0).length;
    const exercises = day.phases.reduce((sum, p) => 
      sum + (p.groups?.reduce((gSum, g) => gSum + g.exercises.length, 0) || 0), 0
    );
    // Rough estimation: 2 min per exercise
    const estimatedMinutes = exercises * 2;
    return { blocks, exercises, estimatedMinutes };
  }, [day.phases]);

  const totalExercises = day.phases.reduce((sum, phase) => {
    const groups = phase.groups || [];
    return sum + groups.reduce((gSum, g) => gSum + g.exercises.length, 0);
  }, 0);

  return (
    <Card className="overflow-hidden bg-card shadow-sm">
      <CardHeader className="pb-4 sticky top-[73px] bg-card z-20 border-b border-border/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-11 w-11 min-w-[44px] min-h-[44px] shrink-0"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Comprimi giorno" : "Espandi giorno"}
            >
              <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
            <div className="flex-1 min-w-0">
              <Input
                value={day.title}
                onChange={(e) => onUpdateTitle(e.target.value)}
                className="text-lg font-semibold h-11 mb-2"
                disabled={readonly}
                readOnly={readonly}
                aria-label="Titolo giorno"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {summary.blocks} {summary.blocks === 1 ? 'blocco' : 'blocchi'}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {summary.exercises} {summary.exercises === 1 ? 'esercizio' : 'esercizi'}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  ~{summary.estimatedMinutes} min
                </Badge>
              </div>
            </div>
          </div>
          {!readonly && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDuplicate}
                title="Duplica giorno"
                className="h-11 w-11 min-w-[44px] min-h-[44px]"
                aria-label="Duplica giorno"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 min-w-[44px] min-h-[44px] text-destructive hover:text-destructive"
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
                      Questa azione non può essere annullata. Tutti gli esercizi verranno eliminati.
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
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6 pt-6">
          {/* Day Objective - only show if readonly and exists, or if editable */}
          {(day.objective || !readonly) && (
            <div className="space-y-2">
              {!readonly ? (
                <>
                  <label className="text-sm font-medium text-muted-foreground">
                    Obiettivo del giorno (opzionale)
                  </label>
                  <Textarea
                    value={day.objective || ""}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 120);
                      if (onUpdateObjective) {
                        onUpdateObjective(value);
                      }
                    }}
                    placeholder="Descrivi l'obiettivo di questo giorno (max 120 caratteri)..."
                    className="resize-none text-sm"
                    rows={2}
                    maxLength={120}
                    aria-label="Obiettivo del giorno"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {(day.objective || "").length}/120
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3 italic">
                  {day.objective}
                </div>
              )}
            </div>
          )}

          {day.phases.map((phase) => (
            <PhaseSectionCompact
              key={phase.id}
              phase={phase}
              onAddGroup={(groupType) => onAddGroup(phase.type, groupType)}
              onUpdateGroup={(groupId, updates) => onUpdateGroup(phase.type, groupId, updates)}
              onDuplicateGroup={(groupId) => onDuplicateGroup(phase.type, groupId)}
              onDeleteGroup={(groupId) => onDeleteGroup(phase.type, groupId)}
              onAddExerciseToGroup={(groupId) => onAddExerciseToGroup(phase.type, groupId)}
              onUpdateExercise={(groupId, exerciseId, patch) => onUpdateExercise(phase.type, groupId, exerciseId, patch)}
              onDuplicateExercise={(groupId, exerciseId) => onDuplicateExercise(phase.type, groupId, exerciseId)}
              onDeleteExercise={(groupId, exerciseId) => onDeleteExercise(phase.type, groupId, exerciseId)}
              onUpdatePhaseObjective={
                onUpdatePhaseObjective
                  ? (objective) => onUpdatePhaseObjective(phase.type, objective)
                  : undefined
              }
              readonly={readonly}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
};
