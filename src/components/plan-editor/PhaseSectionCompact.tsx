import { Phase, Exercise, ExerciseGroup, GroupType, migratePhaseToGroups } from "@/types/plan";
import { UnifiedSortableItem } from "./UnifiedSortableItem";
import { ExerciseTableHeader } from "./ExerciseTableHeader";
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
import { getDragId, parseDragId, moveWithin, canDrop, DnDItemType } from "./dnd-utils";
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
        distance: 8,
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

    const activeLevel = active.data.current?.level;
    const overLevel = over.data.current?.level;

    if (activeLevel && overLevel && !canDrop(activeLevel, overLevel)) {
      toast.error("Spostamento non consentito", {
        description: "Puoi riordinare solo elementi dello stesso livello",
      });
      return;
    }

    const oldIndex = groups.findIndex((g) => g.id === activeData.itemId);
    const newIndex = groups.findIndex((g) => g.id === overData.itemId);

    if (oldIndex === -1 || newIndex === -1) return;

    try {
      const newGroups = moveWithin(groups, oldIndex, newIndex);
      setGroups(newGroups);

      newGroups.forEach((group, index) => {
        onUpdateGroup(group.id, { order: index + 1 });
      });
    } catch (error) {
      console.error("Drag & drop error:", error);
      toast.error("Errore durante il riordino");
      setGroups([...groups]);
    }
  };

  const totalExercises = groups.reduce((sum, g) => sum + g.exercises.length, 0);

  return (
    <div className="space-y-4">
      {/* Phase Header - Minimal */}
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {phaseLabels[phase.type] || phase.type}
        </h3>
        <span className="text-xs text-muted-foreground">
          {totalExercises} {totalExercises === 1 ? "esercizio" : "esercizi"}
        </span>
      </div>

      {/* Phase Objective - Compact */}
      {(phase.objective || !readonly) && onUpdatePhaseObjective && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`phase-objective-${phase.id}`} className="text-xs font-medium text-muted-foreground">
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
              placeholder="Descrivi l'obiettivo di questo blocco..."
              className="resize-none text-sm pr-14 min-h-[60px] border-0 bg-muted/30 focus:bg-muted/50"
              rows={2}
              maxLength={120}
              disabled={readonly}
            />
            <div className="absolute bottom-2 right-3 text-xs text-muted-foreground/60">
              {(phase.objective || "").length}/120
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        // Empty state - Minimal inline CTAs
        <div className="flex items-center gap-3 py-3 text-sm text-muted-foreground">
          <button
            onClick={() => onAddGroup("single")}
            className="hover:text-foreground hover:underline underline-offset-2 transition-colors"
            disabled={readonly}
          >
            + Aggiungi esercizio
          </button>
          <span className="text-muted-foreground/40">·</span>
          <button
            onClick={() => onAddGroup("superset")}
            className="hover:text-foreground hover:underline underline-offset-2 transition-colors"
            disabled={readonly}
          >
            Superset
          </button>
          <span className="text-muted-foreground/40">·</span>
          <button
            onClick={() => onAddGroup("circuit")}
            className="hover:text-foreground hover:underline underline-offset-2 transition-colors"
            disabled={readonly}
          >
            Circuit
          </button>
        </div>
      ) : (
        <>
          {/* Table Header - only for single exercises on desktop */}
          <ExerciseTableHeader visible={groups.some(g => g.type === "single")} />
          
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
              <div className="space-y-0" data-drop-level="block-item">
                {groups
                  .sort((a, b) => a.order - b.order)
                  .map((group) => {
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
          
          {/* Quick Add - Always visible at end */}
          {!readonly && (
            <button
              onClick={() => onAddGroup("single")}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2 py-2 transition-colors"
            >
              + Aggiungi esercizio
            </button>
          )}
        </>
      )}
    </div>
  );
};
