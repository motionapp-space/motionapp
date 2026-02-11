import { ExerciseGroup, Exercise, PhaseType } from "@/types/plan";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [exercises, setExercises] = useState(group.exercises);

  useEffect(() => {
    setExercises(group.exercises);
  }, [group.exercises]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleExerciseDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeLevel = active.data.current?.level;
    const overLevel = over.data.current?.level;

    if (activeLevel !== "group-exercise" || overLevel !== "group-exercise") {
      return;
    }

    const oldIndex = exercises.findIndex((e) => e.id === active.id);
    const newIndex = exercises.findIndex((e) => e.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newExercises = arrayMove(exercises, oldIndex, newIndex);
    setExercises(newExercises);

    newExercises.forEach((exercise, index) => {
      onUpdateExercise(exercise.id, { order: index + 1 });
    });
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
    <div className="pl-4 border-l-2 border-primary/40 space-y-3 py-3">
      {/* Header - Inline with shared params */}
      <div className="flex items-center gap-3 py-1 flex-wrap">
        <DraggableHandle
          level="block-item"
          disabled={readonly}
          dragHandleProps={dragHandleProps}
        />
        
        <Badge
          variant="secondary"
          className={
            group.type === "superset"
              ? "bg-primary/10 text-primary font-medium"
              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
          }
        >
          {group.type === "superset" ? "Superset" : "Circuit"}
        </Badge>

        <Input
          value={group.name || ""}
          onChange={(e) => onUpdateGroup({ name: e.target.value })}
          className="max-w-[120px] h-7 border border-transparent bg-transparent font-medium text-sm transition-colors hover:bg-muted/40 focus:bg-muted/50 focus:border-primary/40 focus:ring-0"
          placeholder="Nome"
          disabled={readonly}
        />

        {/* Shared parameters inline */}
        {group.type === "superset" && (
          <>
            <span className="text-xs text-muted-foreground">Serie:</span>
            <Input
              type="number"
              value={group.sharedSets || ""}
              onChange={(e) =>
                onUpdateGroup({ sharedSets: parseInt(e.target.value) || undefined })
              }
className="w-16 h-7 text-center border border-transparent bg-transparent text-sm transition-colors hover:bg-muted/40 focus:bg-muted/50 focus:border-primary/40 focus:ring-0"
              placeholder="4"
              disabled={readonly}
            />
            <span className="text-xs text-muted-foreground">Rec:</span>
            <Input
              value={group.sharedRestBetweenExercises || ""}
              onChange={(e) =>
                onUpdateGroup({ sharedRestBetweenExercises: e.target.value })
              }
              className="w-14 h-7 text-center border border-transparent bg-transparent text-sm transition-colors hover:bg-muted/40 focus:bg-muted/50 focus:border-primary/40 focus:ring-0"
              placeholder="30s"
              disabled={readonly}
            />
          </>
        )}

        {group.type === "circuit" && (
          <>
            <span className="text-xs text-muted-foreground">Giri:</span>
            <Input
              type="number"
              value={group.rounds || 1}
              onChange={(e) =>
                onUpdateGroup({ rounds: Math.max(1, parseInt(e.target.value) || 1) })
              }
              className="w-12 h-7 text-center border border-transparent bg-transparent text-sm transition-colors hover:bg-muted/40 focus:bg-muted/50 focus:border-primary/40 focus:ring-0"
              min={1}
              disabled={readonly}
            />
            <span className="text-xs text-muted-foreground">Rec giri:</span>
            <Input
              value={group.restBetweenRounds || ""}
              onChange={(e) => onUpdateGroup({ restBetweenRounds: e.target.value })}
              className="w-14 h-7 text-center border border-transparent bg-transparent text-sm transition-colors hover:bg-muted/40 focus:bg-muted/50 focus:border-primary/40 focus:ring-0"
              placeholder="90s"
              disabled={readonly}
            />
          </>
        )}

        {/* Actions - Text style */}
        {!readonly && (
          <div className="ml-auto flex items-center gap-2 text-sm">
            <button
              onClick={onDuplicateGroup}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Duplica
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-muted-foreground hover:text-destructive transition-colors">
                  Elimina
                </button>
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

      {/* Exercises List - No header here, it's at phase level */}
      <div className="space-y-0">
        {exercises.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleExerciseDragEnd}
          >
            <SortableContext
              items={exercises.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div data-drop-level="group-exercise">
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
        )}
      </div>

      {/* Quick add */}
      {!readonly && (
        <button
          onClick={handleAddExercise}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2 mt-2 transition-colors"
        >
          + Aggiungi esercizio
        </button>
      )}
    </div>
  );
};
