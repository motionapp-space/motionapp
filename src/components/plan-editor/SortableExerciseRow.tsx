import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExerciseRowCompact } from "./ExerciseRowCompact";
import { Exercise } from "@/types/plan";

interface SortableExerciseRowProps {
  groupId: string;
  exercise: Exercise;
  onUpdate: (patch: Partial<Exercise>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  readonly?: boolean;
}

export const SortableExerciseRow = ({
  groupId,
  exercise,
  onUpdate,
  onDuplicate,
  onDelete,
  readonly = false,
}: SortableExerciseRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: groupId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ExerciseRowCompact
        exercise={exercise}
        onUpdate={onUpdate}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        readonly={readonly}
        dragHandleProps={readonly ? undefined : listeners}
      />
    </div>
  );
};
