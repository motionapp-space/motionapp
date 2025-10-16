import { Exercise } from "@/types/plan";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";

interface ExerciseRowCompactProps {
  exercise: Exercise;
  onUpdate: (patch: Partial<Exercise>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const ExerciseRowCompact = ({ exercise, onUpdate, onDuplicate, onDelete }: ExerciseRowCompactProps) => {
  return (
    <div className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-muted">
      {/* Name */}
      <div className="col-span-3">
        <Input
          value={exercise.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nome esercizio"
          className="h-11"
        />
      </div>
      
      {/* Sets */}
      <div className="col-span-1">
        <Input
          type="number"
          value={exercise.sets}
          onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || 0 })}
          placeholder="Serie"
          className="h-11 text-center"
          min={0}
        />
      </div>
      
      {/* Reps */}
      <div className="col-span-1">
        <Input
          value={exercise.reps}
          onChange={(e) => onUpdate({ reps: e.target.value })}
          placeholder="Rip"
          className="h-11 text-center"
        />
      </div>
      
      {/* Load */}
      <div className="col-span-1">
        <Input
          value={exercise.load || ""}
          onChange={(e) => onUpdate({ load: e.target.value })}
          placeholder="Carico"
          className="h-11 text-center"
        />
      </div>
      
      {/* Rest */}
      <div className="col-span-1">
        <Input
          value={exercise.rest || ""}
          onChange={(e) => onUpdate({ rest: e.target.value })}
          placeholder="Rec"
          className="h-11 text-center"
        />
      </div>
      
      {/* Goal */}
      <div className="col-span-2">
        <Input
          value={exercise.goal || ""}
          onChange={(e) => onUpdate({ goal: e.target.value })}
          placeholder="Obiettivo"
          className="h-11"
          aria-label="Obiettivo"
        />
      </div>
      
      {/* Notes */}
      <div className="col-span-2">
        <Input
          value={exercise.notes || ""}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Note"
          className="h-11"
        />
      </div>
      
      {/* Actions */}
      <div className="col-span-1 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDuplicate}
          title="Duplica esercizio"
          className="h-9 w-9 hover:bg-muted/40 transition-colors"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          title="Elimina esercizio"
          className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
