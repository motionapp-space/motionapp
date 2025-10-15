import { Exercise } from "@/types/plan";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";

interface ExerciseRowProps {
  exercise: Exercise;
  onUpdate: (patch: Partial<Exercise>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const ExerciseRow = ({ exercise, onUpdate, onDuplicate, onDelete }: ExerciseRowProps) => {
  return (
    <div className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="col-span-4">
        <Input
          value={exercise.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nome esercizio"
          className="h-9"
        />
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          value={exercise.sets}
          onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || 0 })}
          placeholder="Serie"
          className="h-9"
          min={0}
        />
      </div>
      <div className="col-span-1">
        <Input
          value={exercise.reps}
          onChange={(e) => onUpdate({ reps: e.target.value })}
          placeholder="Rip"
          className="h-9"
        />
      </div>
      <div className="col-span-2">
        <Input
          value={exercise.load || ""}
          onChange={(e) => onUpdate({ load: e.target.value })}
          placeholder="Carico"
          className="h-9"
        />
      </div>
      <div className="col-span-1">
        <Input
          value={exercise.rest || ""}
          onChange={(e) => onUpdate({ rest: e.target.value })}
          placeholder="Rec"
          className="h-9"
        />
      </div>
      <div className="col-span-2">
        <Input
          value={exercise.notes || ""}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Note"
          className="h-9"
        />
      </div>
      <div className="col-span-1 flex gap-1 justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onDuplicate}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
