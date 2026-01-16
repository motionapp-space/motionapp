import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EditableChip } from "./EditableChip";
import type { Exercise } from "@/types/plan";
import type { ExerciseActual } from "../types";

interface ExerciseCardProps {
  exercise: Exercise;
  actuals: ExerciseActual[];
  restTimer: number;
  isSkipped: boolean;
  editableValues: { reps: string; load: string; rest: string };
  onValueChange: (field: "reps" | "load" | "rest", value: string) => void;
  onCompleteSet: () => void;
  onUndoLastSet: () => void;
  onSkip: () => void;
  onResume: () => void;
  onOpenHistory: () => void;
}

export function ExerciseCard({
  exercise,
  actuals,
  restTimer,
  isSkipped,
  editableValues,
  onValueChange,
  onCompleteSet,
  onUndoLastSet,
  onSkip,
  onResume,
  onOpenHistory,
}: ExerciseCardProps) {
  const formatRestTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Get badge color based on completion status
  const getBadgeStyles = () => {
    if (actuals.length < exercise.sets) {
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
    }
    if (actuals.length === exercise.sets) {
      return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
    }
    return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
  };

  return (
    <div
      className={cn(
        "p-4 rounded-[16px] border border-muted bg-background mb-4",
        isSkipped && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={cn(
                "text-[16px] font-semibold",
                isSkipped && "line-through text-muted-foreground"
              )}
            >
              {exercise.name || "Esercizio senza nome"}
            </h3>
            {isSkipped && (
              <Badge variant="outline" className="text-[11px]">
                Saltato
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenHistory}
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Storico
          </button>
          <span
            className={cn(
              "text-[11px] px-2 py-[2px] rounded-full",
              getBadgeStyles()
            )}
          >
            {actuals.length}/{exercise.sets}
          </span>
        </div>
      </div>

      {/* Target subheader */}
      <p className="text-[13px] text-muted-foreground mt-1">
        Target: {exercise.sets} × {exercise.reps}
        {exercise.load && ` @ ${exercise.load}`}
        {exercise.rest && ` · Recupero: ${exercise.rest}`}
      </p>

      {exercise.goal && (
        <p className="text-[13px] text-muted-foreground italic mt-1">
          Obiettivo: {exercise.goal}
        </p>
      )}

      {/* Valori prossima serie (only if not skipped) */}
      {!isSkipped && (
        <div className="mt-3 p-3 rounded-[12px] bg-muted/30">
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground mb-2">
            Prossima serie
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <EditableChip
              label="Reps"
              value={editableValues.reps}
              onChange={(v) => onValueChange("reps", v)}
              placeholder={exercise.reps}
              inputMode="numeric"
            />
            <EditableChip
              label="Carico"
              value={editableValues.load}
              onChange={(v) => onValueChange("load", v)}
              placeholder={exercise.load || "N/A"}
            />
            <EditableChip
              label="Rest"
              value={editableValues.rest}
              onChange={(v) => onValueChange("rest", v)}
              placeholder={exercise.rest || "N/A"}
            />
          </div>
        </div>
      )}

      {/* Rest timer */}
      {restTimer > 0 && (
        <p className="mt-3 text-[14px] font-semibold text-primary">
          Recupero: {formatRestTimer(restTimer)}
        </p>
      )}

      {/* Completed sets */}
      {actuals.length > 0 && (
        <div className="mt-3">
          <p className="text-[13px] font-medium mb-2">Serie completate</p>
          <div className="flex flex-wrap gap-2">
            {actuals.map((actual, idx) => {
              const repsDiff = actual.reps !== exercise.reps;
              const loadDiff =
                actual.load && exercise.load && actual.load !== exercise.load;

              return (
                <span
                  key={actual.id}
                  className={cn(
                    "h-8 px-3 rounded-full text-[13px] bg-muted flex items-center",
                    (repsDiff || loadDiff) &&
                      "border border-orange-500 text-orange-700 dark:text-orange-400"
                  )}
                >
                  #{idx + 1}: {actual.reps}r
                  {actual.load && ` × ${actual.load}`}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA area */}
      {!isSkipped ? (
        <div className="mt-4 space-y-2">
          {/* Primary CTA */}
          <Button
            onClick={onCompleteSet}
            className="w-full h-12 rounded-[12px] text-[15px] font-semibold"
          >
            ✓ Completa serie
          </Button>

          {/* Secondary row */}
          <div className="flex items-center justify-between">
            {/* Annulla - only if there are completed sets */}
            {actuals.length > 0 ? (
              <Button
                variant="outline"
                className="h-10 text-[14px]"
                onClick={onUndoLastSet}
              >
                Annulla
              </Button>
            ) : (
              <div />
            )}

            {/* Salta - text only, not a button */}
            <button
              type="button"
              onClick={onSkip}
              className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Salta
            </button>
          </div>
        </div>
      ) : (
        /* Skipped state */
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={onResume}
          >
            Riprendi esercizio
          </Button>
        </div>
      )}
    </div>
  );
}
