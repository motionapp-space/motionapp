import { Exercise } from "@/types/plan";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface ExerciseRowCompactProps {
  exercise: Exercise;
  onUpdate: (patch: Partial<Exercise>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  readonly?: boolean;
}

export const ExerciseRowCompact = ({ exercise, onUpdate, onDuplicate, onDelete, readonly = false }: ExerciseRowCompactProps) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="rounded-lg border border-border hover:border-muted-foreground/20 transition-colors bg-card">
      {/* Main Row */}
      <div className={`grid ${readonly ? 'grid-cols-11' : 'grid-cols-12'} gap-3 items-center p-3`}>
        {/* Drag Handle */}
        {!readonly && (
          <div className="col-span-1 flex items-center justify-center cursor-grab active:cursor-grabbing" aria-label="Trascina per riordinare">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        
        {/* Name */}
        <div className={readonly ? "col-span-3" : "col-span-2"}>
          <Input
            value={exercise.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Nome esercizio"
            className="h-11"
            disabled={readonly}
            readOnly={readonly}
            aria-label="Nome esercizio"
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
            disabled={readonly}
            readOnly={readonly}
            aria-label="Serie"
          />
        </div>
        
        {/* Reps */}
        <div className="col-span-1">
          <Input
            value={exercise.reps}
            onChange={(e) => onUpdate({ reps: e.target.value })}
            placeholder="Rip"
            className="h-11 text-center"
            disabled={readonly}
            readOnly={readonly}
            aria-label="Ripetizioni"
          />
        </div>
        
        {/* Load */}
        <div className="col-span-1">
          <Input
            value={exercise.load || ""}
            onChange={(e) => onUpdate({ load: e.target.value })}
            placeholder="kg"
            className="h-11 text-center"
            disabled={readonly}
            readOnly={readonly}
            aria-label="Carico"
          />
        </div>
        
        {/* Rest */}
        <div className="col-span-1">
          <Input
            value={exercise.rest || ""}
            onChange={(e) => onUpdate({ rest: e.target.value })}
            placeholder="60s"
            className="h-11 text-center"
            disabled={readonly}
            readOnly={readonly}
            aria-label="Recupero"
          />
        </div>
        
        {/* More Toggle & Actions */}
        <div className={`${readonly ? 'col-span-4' : 'col-span-5'} flex items-center justify-end gap-2`}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowMore(!showMore)}
            className="gap-1 h-9 text-muted-foreground hover:text-foreground"
            aria-expanded={showMore}
            aria-controls={`exercise-${exercise.id}-more`}
          >
            {showMore ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span className="text-xs">Meno</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span className="text-xs">Altro</span>
              </>
            )}
          </Button>
          
          {!readonly && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDuplicate}
                title="Duplica esercizio"
                className="h-9 w-9 min-w-[44px] min-h-[44px] hover:bg-muted/40 transition-colors"
                aria-label="Duplica esercizio"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                title="Elimina esercizio"
                className="h-9 w-9 min-w-[44px] min-h-[44px] text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Elimina esercizio"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progressive Disclosure - Goal & Notes */}
      {showMore && (
        <div 
          id={`exercise-${exercise.id}-more`}
          className="grid grid-cols-2 gap-3 p-3 pt-0 border-t border-border/50 bg-muted/10 animate-accordion-down"
          role="region"
          aria-label="Dettagli aggiuntivi esercizio"
        >
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Obiettivo</label>
            <Input
              value={exercise.goal || ""}
              onChange={(e) => onUpdate({ goal: e.target.value })}
              placeholder="Es: Aumentare forza"
              className="h-11"
              disabled={readonly}
              readOnly={readonly}
              aria-label="Obiettivo"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Note</label>
            <Textarea
              value={exercise.notes || ""}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Note aggiuntive..."
              className="min-h-[44px] resize-none"
              rows={1}
              disabled={readonly}
              readOnly={readonly}
              aria-label="Note"
            />
          </div>
        </div>
      )}
    </div>
  );
};
