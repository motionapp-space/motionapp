import { Phase, Exercise, ExerciseGroup, GroupType, migratePhaseToGroups } from "@/types/plan";
import { GroupCard } from "./GroupCard";
import { AddMenu } from "./AddMenu";

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
  readonly = false,
}: PhaseSectionCompactProps) => {
  // Migrate legacy exercises to groups
  const migratedPhase = migratePhaseToGroups(phase);
  const groups = migratedPhase.groups;

  const totalExercises = groups.reduce((sum, g) => sum + g.exercises.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {phaseLabels[phase.type] || phase.type}
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalExercises} {totalExercises === 1 ? 'esercizio' : 'esercizi'}
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

      {groups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg" role="status">
          <p>Nessun esercizio ancora</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups
            .sort((a, b) => a.order - b.order)
            .map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                phaseType={phase.type}
                onUpdateGroup={(updates) => onUpdateGroup(group.id, updates)}
                onDuplicateGroup={() => onDuplicateGroup(group.id)}
                onDeleteGroup={() => onDeleteGroup(group.id)}
                onAddExercise={() => onAddExerciseToGroup(group.id)}
                onUpdateExercise={(exerciseId, patch) => onUpdateExercise(group.id, exerciseId, patch)}
                onDuplicateExercise={(exerciseId) => onDuplicateExercise(group.id, exerciseId)}
                onDeleteExercise={(exerciseId) => onDeleteExercise(group.id, exerciseId)}
                readonly={readonly}
              />
            ))}
        </div>
      )}
    </div>
  );
};
