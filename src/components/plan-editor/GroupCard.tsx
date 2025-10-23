import { ExerciseGroup, Exercise, PhaseType } from "@/types/plan";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Plus, GripVertical, Edit2 } from "lucide-react";
import { ExerciseRowCompact } from "./ExerciseRowCompact";
import { useState } from "react";
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
    <Card className="overflow-hidden">
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
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{group.name}</span>
                    {!readonly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditingName(true)}
                        className="h-6 w-6"
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

          {!readonly && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onDuplicateGroup}
                title="Duplica gruppo"
                className="h-9 w-9"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    title="Elimina gruppo"
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
            </div>
          )}
        </div>

        {/* Shared/Circuit Controls */}
        {!readonly && group.type === "superset" && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Serie condivise</Label>
              <Input
                type="number"
                value={group.sharedSets || ""}
                onChange={(e) => onUpdateGroup({ sharedSets: parseInt(e.target.value) || undefined })}
                placeholder="4"
                className="h-11 w-20"
                min={0}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Rec tra esercizi</Label>
              <Input
                value={group.sharedRestBetweenExercises || ""}
                onChange={(e) => onUpdateGroup({ sharedRestBetweenExercises: e.target.value })}
                placeholder="0s"
                className="h-11 w-20"
              />
            </div>
          </div>
        )}

        {!readonly && group.type === "circuit" && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Giri</Label>
              <Input
                type="number"
                value={group.rounds || 1}
                onChange={(e) => onUpdateGroup({ rounds: Math.max(1, parseInt(e.target.value) || 1) })}
                className="h-11 w-20"
                min={1}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Rec tra giri</Label>
              <Input
                value={group.restBetweenRounds || ""}
                onChange={(e) => onUpdateGroup({ restBetweenRounds: e.target.value })}
                placeholder="90s"
                className="h-11 w-24"
              />
            </div>
          </div>
        )}

        {/* Exercises Table */}
        <div className="space-y-2">
          {group.exercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              Nessun esercizio ancora
            </div>
          ) : (
            <>
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-3 px-3 pb-2 text-xs font-medium text-muted-foreground border-b">
                <div className="col-span-3">Nome</div>
                <div className="col-span-1 text-center">Serie</div>
                <div className="col-span-1 text-center">Rip</div>
                <div className="col-span-1 text-center">Carico</div>
                <div className="col-span-1 text-center">Rec</div>
                <div className="col-span-2">Obiettivo</div>
                <div className="col-span-2">Note</div>
                {!readonly && <div className="col-span-1"></div>}
              </div>

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
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!readonly && (
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddExercise}
              className="gap-2 h-11"
            >
              <Plus className="h-4 w-4" />
              Aggiungi esercizio al gruppo
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
