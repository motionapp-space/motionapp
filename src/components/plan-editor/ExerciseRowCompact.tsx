import { Exercise } from "@/types/plan";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ExerciseRowCompactProps {
  exercise: Exercise;
  onUpdate: (patch: Partial<Exercise>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const ExerciseRowCompact = ({ exercise, onUpdate, onDuplicate, onDelete }: ExerciseRowCompactProps) => {
  return (
    <div className="grid grid-cols-12 gap-3 items-start p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-muted">
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
          className="h-11"
          min={0}
        />
      </div>
      
      {/* Reps */}
      <div className="col-span-1">
        <Input
          value={exercise.reps}
          onChange={(e) => onUpdate({ reps: e.target.value })}
          placeholder="Rip"
          className="h-11"
        />
      </div>
      
      {/* Load */}
      <div className="col-span-2">
        <Input
          value={exercise.load || ""}
          onChange={(e) => onUpdate({ load: e.target.value })}
          placeholder="Carico"
          className="h-11"
        />
      </div>
      
      {/* Rest */}
      <div className="col-span-1">
        <Input
          value={exercise.rest || ""}
          onChange={(e) => onUpdate({ rest: e.target.value })}
          placeholder="Rec"
          className="h-11"
        />
      </div>
      
      {/* Goal */}
      <div className="col-span-2">
        <div className="space-y-1">
          <Label htmlFor={`goal-${exercise.id}`} className="text-xs font-medium">
            Obiettivo
          </Label>
          <Input
            id={`goal-${exercise.id}`}
            value={exercise.goal || ""}
            onChange={(e) => onUpdate({ goal: e.target.value })}
            placeholder="Es. aumentare carico"
            className="h-11"
          />
        </div>
      </div>
      
      {/* Notes */}
      <div className="col-span-1">
        <Textarea
          value={exercise.notes || ""}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Note"
          className="min-h-[44px] h-11 resize-none"
          rows={1}
        />
      </div>
      
      {/* Actions */}
      <div className="col-span-1 flex items-center justify-end gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDuplicate}
          title="Duplica esercizio"
          className="h-11 w-11 hover:bg-muted/40 transition-colors"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          title="Elimina esercizio"
          className="h-11 w-11 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
