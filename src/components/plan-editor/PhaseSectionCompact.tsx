import { Phase, Exercise, ExerciseGroup, GroupType, migratePhaseToGroups } from "@/types/plan";
import { UnifiedSortableItem } from "./UnifiedSortableItem";
import { AddMenu } from "./AddMenu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState, useEffect } from "react";
import { getDragId, parseDragId, moveWithin, DnDItemType } from "./dnd-utils";
import { toast } from "sonner";

interface PhaseSectionCompactProps {
  phase: Phase;
  onAddGroup: (type: GroupType) => void;
  onUpdateGroup: (groupId: string, updates: Partial<ExerciseGroup>) => void;
  onDuplicateGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddExerciseToGroup: (groupId: string) => void;
  onUpdateExercise: (groupId: string, exerciseId: string, patch: Partial<Exercise>) => void;
  onDuplicateExercise: (groupId: string, exerciseId: string) => void;
  onDeleteExercise: (groupId: string, exerciseId: string) => void;
  onUpdatePhaseObjective?: (objective: string) => void;
  readonly?: boolean;
}

const phaseLabels: Record<string, string> = {
  "Warm-up": "Riscaldamento",
  "Main Workout": "Corpo principale",
  "Stretching": "Stretching",
};

export const PhaseSectionCompact = ({
  phase,
  onAddGroup,
  onUpdateGroup,
  onDuplicateGroup,
  onDeleteGroup,
  onAddExerciseToGroup,
  onUpdateExercise,
  onDuplicateExercise,
  onDeleteExercise,
  onUpdatePhaseObjective,
  readonly = false,
}: PhaseSectionCompactProps) => {
  // Migrate legacy exercises to groups
  const migratedPhase = migratePhaseToGroups(phase);
  const [groups, setGroups] = useState(migratedPhase.groups);

  useEffect(() => {
    setGroups(migratePhaseToGroups(phase).groups);
  }, [phase]);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeData = parseDragId(active.id as string);
    const overData = parseDragId(over.id as string);

    if (!activeData || !overData) return;

    // Find indices in the block-top list
    const oldIndex = groups.findIndex((g) => g.id === activeData.itemId);
    const newIndex = groups.findIndex((g) => g.id === overData.itemId);

    if (oldIndex === -1 || newIndex === -1) return;

    try {
      // Reorder block-top items (heterogeneous: exercise, superset, circuit)
      const newGroups = moveWithin(groups, oldIndex, newIndex);
      setGroups(newGroups);

      // Update order for all groups
      newGroups.forEach((group, index) => {
        onUpdateGroup(group.id, { order: index + 1 });
      });
    } catch (error) {
      console.error("Drag & drop error:", error);
      toast.error("Errore durante il riordino");
      // Rollback on error
      setGroups([...groups]);
    }
  };

  const totalExercises = groups.reduce((sum, g) => sum + g.exercises.length, 0);

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">
            {phaseLabels[phase.type] || phase.type}
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalExercises} {totalExercises === 1 ? "esercizio" : "esercizi"}
          </p>
        </div>
        {!readonly && (
          <AddMenu
            context="day"
            onAddExercise={() => onAddGroup("single")}
            onAddSuperset={() => onAddGroup("superset")}
            onAddCircuit={() => onAddGroup("circuit")}
          />
        )}
      </div>

      {/* Phase/Block Objective */}
      {(phase.objective || !readonly) && onUpdatePhaseObjective && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`phase-objective-${phase.id}`} className="text-sm font-semibold text-foreground">
            Obiettivo del blocco
          </Label>
          <div className="relative">
            <Textarea
              id={`phase-objective-${phase.id}`}
              value={phase.objective || ""}
              onChange={(e) => {
                const value = e.target.value.slice(0, 120);
                onUpdatePhaseObjective(value);
              }}
              placeholder="Descrivi l'obiettivo di questo blocco (max 120 caratteri)…"
              className="resize-none text-sm pr-16"
              rows={2}
              maxLength={120}
              aria-describedby={`phase-objective-count-${phase.id}`}
              disabled={readonly}
            />
            <div
              id={`phase-objective-count-${phase.id}`}
              className="absolute bottom-2 right-3 text-xs text-muted-foreground select-none pointer-events-none"
            >
              {(phase.objective || "").length}/120
            </div>
          </div>
        </div>
      )}

      {/* Groups List with Drag & Drop */}
      {groups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <p>Nessun esercizio ancora</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={groups.map((g) => {
              if (g.type === "single") {
                return getDragId("exercise", g.id);
              }
              const itemType: DnDItemType = g.type === "superset" ? "group:superset" : "group:circuit";
              return getDragId(itemType, g.id);
            })}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {groups
                .sort((a, b) => a.order - b.order)
                .map((group) => {
                  // Render single exercises as flat rows
                  if (group.type === "single" && group.exercises.length === 1) {
                    const exercise = group.exercises[0];
                    return (
                      <UnifiedSortableItem
                        key={group.id}
                        item={{ type: "exercise", exercise, groupId: group.id }}
                        phaseType={phase.type}
                        onUpdateExercise={(patch) => onUpdateExercise(group.id, exercise.id, patch)}
                        onDuplicateExercise={() => onDuplicateExercise(group.id, exercise.id)}
                        onDeleteExercise={() => onDeleteGroup(group.id)}
                        readonly={readonly}
                      />
                    );
                  }
                  
                  // Render supersets and circuits as grouped cards
                  return (
                    <UnifiedSortableItem
                      key={group.id}
                      item={{ type: "group", group }}
                      phaseType={phase.type}
                      onUpdateGroup={(updates) => onUpdateGroup(group.id, updates)}
                      onDuplicateGroup={() => onDuplicateGroup(group.id)}
                      onDeleteGroup={() => onDeleteGroup(group.id)}
                      onAddExercise={() => onAddExerciseToGroup(group.id)}
                      onUpdateGroupExercise={(exerciseId, patch) =>
                        onUpdateExercise(group.id, exerciseId, patch)
                      }
                      onDuplicateGroupExercise={(exerciseId) =>
                        onDuplicateExercise(group.id, exerciseId)
                      }
                      onDeleteGroupExercise={(exerciseId) =>
                        onDeleteExercise(group.id, exerciseId)
                      }
                      readonly={readonly}
                    />
                  );
                })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
