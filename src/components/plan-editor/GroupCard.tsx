import { ExerciseGroup, Exercise, PhaseType } from "@/types/plan";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Plus, Edit2, ChevronDown, Info } from "lucide-react";
import { SortableExerciseInGroup } from "./SortableExerciseInGroup";
import { DraggableHandle } from "./DraggableHandle";
import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
  dragHandleProps?: any;
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
  dragHandleProps,
}: GroupCardProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [exercises, setExercises] = useState(group.exercises);

  useEffect(() => {
    setExercises(group.exercises);
  }, [group.exercises]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleExerciseDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Validate level
    const activeLevel = active.data.current?.level;
    const overLevel = over.data.current?.level;

    if (activeLevel !== "group-exercise" || overLevel !== "group-exercise") {
      console.warn("Cross-level drag attempt blocked", { activeLevel, overLevel });
      return;
    }

    const oldIndex = exercises.findIndex((e) => e.id === active.id);
    const newIndex = exercises.findIndex((e) => e.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newExercises = arrayMove(exercises, oldIndex, newIndex);
    setExercises(newExercises);

    // Update order for all exercises
    newExercises.forEach((exercise, index) => {
      onUpdateExercise(exercise.id, { order: index + 1 });
    });
  };

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
      <div className="pt-4 px-4 pb-3">
        {/* Header - Single line with title, meta, and actions */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <DraggableHandle
              level="block-item"
              disabled={readonly}
              dragHandleProps={dragHandleProps}
            />
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
            <span className="text-sm text-muted-foreground/60 ml-2">{getGroupMeta()}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
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

        {/* Superset/Circuit Parameters - Inline compact */}
        {isExpanded && !readonly && group.type === "superset" && (
          <div className="flex items-end gap-3 mb-2">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Serie condivise</Label>
              <Input
                type="number"
                value={group.sharedSets || ""}
                onChange={(e) => onUpdateGroup({ sharedSets: parseInt(e.target.value) || undefined })}
                placeholder="4"
                className="h-9 mt-1"
                min={0}
                aria-label="Serie condivise"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Rec tra esercizi</Label>
              <Input
                value={group.sharedRestBetweenExercises || ""}
                onChange={(e) => onUpdateGroup({ sharedRestBetweenExercises: e.target.value })}
                placeholder="30s"
                className="h-9 mt-1"
                aria-label="Recupero tra esercizi"
              />
            </div>
          </div>
        )}

        {isExpanded && !readonly && group.type === "circuit" && (
          <div className="flex items-end gap-3 mb-2">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Giri</Label>
              <Input
                type="number"
                value={group.rounds || 1}
                onChange={(e) => onUpdateGroup({ rounds: Math.max(1, parseInt(e.target.value) || 1) })}
                className="h-9 mt-1"
                min={1}
                aria-label="Numero di giri"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Rec tra giri</Label>
              <Input
                value={group.restBetweenRounds || ""}
                onChange={(e) => onUpdateGroup({ restBetweenRounds: e.target.value })}
                placeholder="90s"
                className="h-9 mt-1"
                aria-label="Recupero tra giri"
              />
            </div>
          </div>
        )}

        {/* Exercises List - Compact spacing */}
        {isExpanded && (
          <div role="region" aria-label="Esercizi del gruppo">
            {exercises.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleExerciseDragEnd}
              >
                <SortableContext
                  items={exercises.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2" data-drop-level="group-exercise">
                    {exercises
                      .sort((a, b) => a.order - b.order)
                      .map((exercise) => (
                        <SortableExerciseInGroup
                          key={exercise.id}
                          exercise={exercise}
                          onUpdate={(patch) => onUpdateExercise(exercise.id, patch)}
                          onDuplicate={() => onDuplicateExercise(exercise.id)}
                          onDelete={() => onDeleteExercise(exercise.id)}
                          readonly={readonly}
                        />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : null}
            
            {/* Single "Add Exercise" CTA */}
            {!readonly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddExercise}
                className="w-full mt-2 h-9 border border-dashed border-border hover:border-primary/50 hover:bg-accent"
                aria-label="Aggiungi esercizio al gruppo"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi esercizio
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
