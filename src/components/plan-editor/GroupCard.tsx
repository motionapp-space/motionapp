import { ExerciseGroup, Exercise, PhaseType } from "@/types/plan";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Plus, GripVertical, Edit2, ChevronDown, Info } from "lucide-react";
import { ExerciseRowCompact } from "./ExerciseRowCompact";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

interface GroupCardProps {
  group: ExerciseGroup;
  phaseType: PhaseType;
  onUpdateGroup: (updates: Partial<ExerciseGroup>) => void;
  onDuplicateGroup: () => void;
  onDeleteGroup: () => void;
  onAddExercise: () => void;
  onUpdateExercise: (exerciseId: string, patch: Partial<Exercise>) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  readonly?: boolean;
}

export const GroupCard = ({
  group,
  phaseType,
  onUpdateGroup,
  onDuplicateGroup,
  onDeleteGroup,
  onAddExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onDeleteExercise,
  readonly = false,
}: GroupCardProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const getGroupBadge = () => {
    if (group.type === "superset") {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">Superset</Badge>;
    }
    if (group.type === "circuit") {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Circuit</Badge>;
    }
    return <Badge variant="outline">Esercizio</Badge>;
  };

  const getGroupMeta = () => {
    if (group.type === "superset") {
      const parts = [];
      parts.push(`${group.exercises.length} esercizi`);
      if (group.sharedSets) parts.push(`${group.sharedSets} serie`);
      if (group.sharedRestBetweenExercises) parts.push(`rec ${group.sharedRestBetweenExercises}`);
      return parts.join(", ");
    }
    if (group.type === "circuit") {
      return `${group.exercises.length} esercizi × ${group.rounds || 1} giri, rec giri ${group.restBetweenRounds || "0s"}`;
    }
    return "1 esercizio";
  };

  const handleAddExercise = () => {
    if (group.type === "superset" && group.exercises.length >= 3) {
      alert("Un superset può contenere massimo 3 esercizi");
      return;
    }
    if (group.type === "circuit" && group.exercises.length >= 6) {
      alert("Un circuito può contenere massimo 6 esercizi");
      return;
    }
    onAddExercise();
  };

  return (
    <Card className="overflow-hidden bg-muted/30 border-muted">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {getGroupBadge()}
              {group.type !== "single" && (
                isEditingName && !readonly ? (
                  <Input
                    value={group.name || ""}
                    onChange={(e) => onUpdateGroup({ name: e.target.value })}
                    onBlur={() => setIsEditingName(false)}
                    className="h-8 max-w-xs"
                    autoFocus
                    aria-label="Modifica nome gruppo"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{group.name}</span>
                    {!readonly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditingName(true)}
                        className="h-6 w-6 min-w-[44px] min-h-[44px]"
                        aria-label="Modifica nome gruppo"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>
            <p className="text-sm text-muted-foreground">{getGroupMeta()}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-9 w-9 min-w-[44px] min-h-[44px]"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Comprimi gruppo" : "Espandi gruppo"}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
            {!readonly && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDuplicateGroup}
                  title="Duplica gruppo"
                  className="h-9 w-9 min-w-[44px] min-h-[44px]"
                  aria-label="Duplica gruppo"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 min-w-[44px] min-h-[44px] text-destructive hover:text-destructive"
                      title="Elimina gruppo"
                      aria-label="Elimina gruppo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminare questo gruppo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tutti gli esercizi del gruppo verranno eliminati.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction onClick={onDeleteGroup}>Elimina</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Shared/Circuit Controls */}
        {isExpanded && !readonly && group.type === "superset" && (
          <div className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border">
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-muted-foreground">Serie condivise</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">Serie eseguite per tutti gli esercizi del superset</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="number"
                value={group.sharedSets || ""}
                onChange={(e) => onUpdateGroup({ sharedSets: parseInt(e.target.value) || undefined })}
                placeholder="4"
                className="h-11"
                min={0}
                aria-label="Serie condivise"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-muted-foreground">Rec tra esercizi</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">Tempo di recupero tra un esercizio e l'altro nel superset</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                value={group.sharedRestBetweenExercises || ""}
                onChange={(e) => onUpdateGroup({ sharedRestBetweenExercises: e.target.value })}
                placeholder="30s"
                className="h-11"
                aria-label="Recupero tra esercizi"
              />
            </div>
          </div>
        )}

        {isExpanded && !readonly && group.type === "circuit" && (
          <div className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border">
            <div className="flex flex-col gap-1 flex-1">
              <Label className="text-xs font-medium text-muted-foreground">Giri</Label>
              <Input
                type="number"
                value={group.rounds || 1}
                onChange={(e) => onUpdateGroup({ rounds: Math.max(1, parseInt(e.target.value) || 1) })}
                className="h-11"
                min={1}
                aria-label="Numero di giri"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <Label className="text-xs font-medium text-muted-foreground">Rec tra giri</Label>
              <Input
                value={group.restBetweenRounds || ""}
                onChange={(e) => onUpdateGroup({ restBetweenRounds: e.target.value })}
                placeholder="90s"
                className="h-11"
                aria-label="Recupero tra giri"
              />
            </div>
          </div>
        )}

        {/* Exercises Table */}
        {isExpanded && (
          <div className="space-y-2" role="region" aria-label="Esercizi del gruppo">
            {group.exercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                Nessun esercizio ancora
              </div>
            ) : (
              <div className="space-y-2">
                {/* Exercise Rows */}
                {group.exercises
                  .sort((a, b) => a.order - b.order)
                  .map((exercise) => (
                    <ExerciseRowCompact
                      key={exercise.id}
                      exercise={exercise}
                      onUpdate={(patch) => onUpdateExercise(exercise.id, patch)}
                      onDuplicate={() => onDuplicateExercise(exercise.id)}
                      onDelete={() => onDeleteExercise(exercise.id)}
                      readonly={readonly}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        {isExpanded && !readonly && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddExercise}
              className="gap-2 h-11 min-w-[44px] min-h-[44px]"
              aria-label="Aggiungi esercizio al gruppo"
            >
              <Plus className="h-4 w-4" />
              Aggiungi esercizio
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
