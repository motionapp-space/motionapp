import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DayCardCompact } from "./DayCardCompact";
import { Day, PhaseType, Exercise, ExerciseGroup, GroupType } from "@/types/plan";

interface SortableDayProps {
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

/**
 * Sortable wrapper for Day cards in the template/plan editor
 * Handles level="day" drag & drop
 */
export const SortableDay = ({
  day,
  readonly = false,
  ...handlers
}: SortableDayProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: day.id,
    disabled: readonly,
    data: {
      level: "day" as const,
      itemId: day.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const dragHandleProps = readonly ? undefined : { ...attributes, ...listeners };

  return (
    <div ref={setNodeRef} style={style}>
      <DayCardCompact
        day={day}
        readonly={readonly}
        dragHandleProps={dragHandleProps}
        {...handlers}
      />
    </div>
  );
};
