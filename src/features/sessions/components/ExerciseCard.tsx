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
      return "bg-warning/20 text-foreground dark:text-warning";
    }
    if (actuals.length === exercise.sets) {
      return "bg-success/20 text-foreground dark:text-success";
    }
    return "bg-warning/20 text-foreground dark:text-warning";
  };

  return (
    <div
      className={cn(
        "p-4 rounded-[16px] border border-border bg-background",
        isSkipped && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={cn(
                "text-[18px] font-semibold leading-[24px]",
                isSkipped && "line-through text-muted-foreground"
              )}
            >
              {exercise.name || "Esercizio senza nome"}
            </h3>
            {isSkipped && (
              <Badge variant="outline" className="text-[11px] font-medium">
                Saltato
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className="h-[22px] px-2 text-[12px] rounded-full inline-flex items-center font-semibold bg-muted text-foreground"
          >
            {actuals.length}/{exercise.sets} serie
          </span>
        </div>
      </div>

      {/* Target subheader */}
      <p className="text-[12px] font-normal text-muted-foreground mt-2 leading-[18px]">
        Target: {exercise.sets} × {exercise.reps}
        {exercise.load && ` @ ${exercise.load}`}
        {exercise.rest && ` · Recupero: ${exercise.rest}`}
      </p>

      {exercise.goal && (
        <p className="text-[12px] font-normal text-muted-foreground italic mt-1 leading-[18px]">
          Obiettivo: {exercise.goal}
        </p>
      )}

      {/* Storico link */}
      <button
        type="button"
        onClick={onOpenHistory}
        className="mt-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Storico
      </button>

      {/* Valori prossima serie (only if not skipped) */}
      {!isSkipped && (
        <div className="mt-3 p-3 rounded-[12px] bg-muted/30">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">
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

      {/* Rest timer - shows active countdown or last rest */}
      {restTimer > 0 ? (
        <p className="mt-2 text-[14px] font-semibold text-primary">
          Recupero: {formatRestTimer(restTimer)}
        </p>
      ) : actuals.length > 0 && exercise.rest && (
        <p className="mt-2 text-[13px] font-normal text-muted-foreground">
          Ultimo recupero: {exercise.rest}
        </p>
      )}

      {/* Completed sets */}
      {actuals.length > 0 && (
        <div className="mt-3">
          <p className="text-[14px] font-semibold leading-[20px] mb-2">Serie completate</p>
          <div className="flex flex-wrap gap-2">
            {actuals.map((actual, idx) => {
              const repsDiff = actual.reps !== exercise.reps;
              const loadDiff =
                actual.load && exercise.load && actual.load !== exercise.load;

              return (
                <span
                  key={actual.id}
                  className={cn(
                    "h-8 px-3 rounded-full text-[13px] font-medium bg-muted flex items-center",
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
          <div className="flex items-baseline justify-between mt-2">
            {/* Annulla ultima serie - only if there are completed sets */}
            {actuals.length > 0 ? (
              <Button
                variant="outline"
                className="h-10 rounded-[10px] text-[14px] font-medium"
                onClick={onUndoLastSet}
              >
                Annulla ultima serie
              </Button>
            ) : (
              <div />
            )}

            {/* Salta - text button, no underline */}
            <button
              type="button"
              onClick={onSkip}
              className="text-[14px] font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors"
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
            className="w-full h-11 rounded-[10px] text-[14px] font-medium"
            onClick={onResume}
          >
            Riprendi esercizio
          </Button>
        </div>
      )}
    </div>
  );
}
