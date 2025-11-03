import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExerciseRowCompact } from "./ExerciseRowCompact";
import { Exercise } from "@/types/plan";

interface SortableExerciseInGroupProps {
  exercise: Exercise;
  onUpdate: (patch: Partial<Exercise>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  readonly?: boolean;
}

/**
 * Sortable wrapper for exercises inside groups (supersets/circuits)
 * Handles level="group-exercise" drag & drop
 */
export const SortableExerciseInGroup = ({
  exercise,
  onUpdate,
  onDuplicate,
  onDelete,
  readonly = false,
}: SortableExerciseInGroupProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.id,
    disabled: readonly,
    data: {
      level: "group-exercise" as const,
      itemId: exercise.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandleProps = readonly ? undefined : { ...attributes, ...listeners };

  return (
    <div ref={setNodeRef} style={style}>
      <ExerciseRowCompact
        exercise={exercise}
        onUpdate={onUpdate}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        readonly={readonly}
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
};
