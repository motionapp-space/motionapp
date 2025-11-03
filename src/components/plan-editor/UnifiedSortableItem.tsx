import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExerciseRowCompact } from "./ExerciseRowCompact";
import { GroupCard } from "./GroupCard";
import { Exercise, ExerciseGroup, PhaseType } from "@/types/plan";
import { getDragId, DnDItemType, ContainerScope } from "./dnd-utils";

interface UnifiedSortableItemProps {
  // Either exercise (single) or group
  item: { type: "exercise"; exercise: Exercise; groupId: string } | { type: "group"; group: ExerciseGroup };
  phaseType: PhaseType;
  // Exercise handlers
  onUpdateExercise?: (patch: Partial<Exercise>) => void;
  onDuplicateExercise?: () => void;
  onDeleteExercise?: () => void;
  // Group handlers
  onUpdateGroup?: (updates: Partial<ExerciseGroup>) => void;
  onDuplicateGroup?: () => void;
  onDeleteGroup?: () => void;
  onAddExercise?: () => void;
  onUpdateGroupExercise?: (exerciseId: string, patch: Partial<Exercise>) => void;
  onDuplicateGroupExercise?: (exerciseId: string) => void;
  onDeleteGroupExercise?: (exerciseId: string) => void;
  readonly?: boolean;
}

export const UnifiedSortableItem = ({
  item,
  phaseType,
  onUpdateExercise,
  onDuplicateExercise,
  onDeleteExercise,
  onUpdateGroup,
  onDuplicateGroup,
  onDeleteGroup,
  onAddExercise,
  onUpdateGroupExercise,
  onDuplicateGroupExercise,
  onDeleteGroupExercise,
  readonly = false,
}: UnifiedSortableItemProps) => {
  // Determine the specific DnD item type
  const itemType: DnDItemType = item.type === "exercise" 
    ? "exercise"
    : item.group.type === "superset"
      ? "group:superset"
      : "group:circuit";

  const dragId = item.type === "exercise" 
    ? getDragId("exercise", item.groupId)
    : getDragId(itemType, item.group.id);

  const containerScope: ContainerScope = "block-top";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: dragId,
    disabled: readonly,
    data: {
      itemType,
      itemId: item.type === "exercise" ? item.groupId : item.group.id,
      containerScope,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandleProps = readonly ? undefined : { ...attributes, ...listeners };

  if (item.type === "exercise") {
    return (
      <div ref={setNodeRef} style={style}>
        <ExerciseRowCompact
          exercise={item.exercise}
          onUpdate={onUpdateExercise!}
          onDuplicate={onDuplicateExercise!}
          onDelete={onDeleteExercise!}
          readonly={readonly}
          dragHandleProps={dragHandleProps}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <GroupCard
        group={item.group}
        phaseType={phaseType}
        onUpdateGroup={onUpdateGroup!}
        onDuplicateGroup={onDuplicateGroup!}
        onDeleteGroup={onDeleteGroup!}
        onAddExercise={onAddExercise!}
        onUpdateExercise={onUpdateGroupExercise!}
        onDuplicateExercise={onDuplicateGroupExercise!}
        onDeleteExercise={onDeleteGroupExercise!}
        readonly={readonly}
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
};
