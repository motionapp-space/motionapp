import { Phase, Exercise, ExerciseGroup, GroupType, migratePhaseToGroups } from "@/types/plan";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";
import { GroupCard } from "./GroupCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          <h3 className="text-lg font-semibold">
            {phaseLabels[phase.type] || phase.type}
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalExercises} {totalExercises === 1 ? 'esercizio' : 'esercizi'}
          </p>
        </div>
        {!readonly && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddGroup("single")}
              className="gap-2 h-11"
            >
              <Plus className="h-4 w-4" />
              Aggiungi esercizio
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-11">
                  <Plus className="h-4 w-4" />
                  Aggiungi gruppo
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAddGroup("superset")}>
                  Superset (2–3 esercizi)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddGroup("circuit")}>
                  Circuit (3+ esercizi)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          Nessun esercizio ancora
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
