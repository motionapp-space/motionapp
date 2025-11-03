import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GroupCard } from "./GroupCard";
import { ExerciseGroup, PhaseType, Exercise } from "@/types/plan";

interface SortableGroupCardProps {
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

export const SortableGroupCard = ({
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
}: SortableGroupCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <GroupCard
        group={group}
        phaseType={phaseType}
        onUpdateGroup={onUpdateGroup}
        onDuplicateGroup={onDuplicateGroup}
        onDeleteGroup={onDeleteGroup}
        onAddExercise={onAddExercise}
        onUpdateExercise={onUpdateExercise}
        onDuplicateExercise={onDuplicateExercise}
        onDeleteExercise={onDeleteExercise}
        readonly={readonly}
        dragHandleProps={readonly ? undefined : listeners}
      />
    </div>
  );
};
