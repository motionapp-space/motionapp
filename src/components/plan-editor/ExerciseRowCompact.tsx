import { Exercise } from "@/types/plan";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Trash2, StickyNote, MoreVertical } from "lucide-react";
import { DraggableHandle } from "./DraggableHandle";
import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExerciseRowCompactProps {
  exercise: Exercise;
  onUpdate: (patch: Partial<Exercise>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  readonly?: boolean;
  dragHandleProps?: any;
}

export const ExerciseRowCompact = ({
  exercise,
  onUpdate,
  onDuplicate,
  onDelete,
  readonly = false,
  dragHandleProps,
}: ExerciseRowCompactProps) => {
  const [notesOpen, setNotesOpen] = useState(false);
  
  const hasNotesOrGoals = Boolean((exercise.notes && exercise.notes.trim()) || (exercise.goal && exercise.goal.trim()));

  return (
    <div className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors group">
      {/* Drag Handle */}
      <DraggableHandle
        level="group-exercise"
        disabled={readonly}
        dragHandleProps={dragHandleProps}
      />

      {/* Exercise Name - Wider */}
      <div className="flex-1 min-w-[200px]">
        <Input
          value={exercise.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nome esercizio"
          disabled={readonly}
          className="h-9 text-sm font-medium"
          aria-label="Nome esercizio"
        />
      </div>

      {/* Sets */}
      <div className="w-20 shrink-0">
        <Input
          type="number"
          value={exercise.sets}
          onChange={(e) => onUpdate({ sets: Math.max(1, parseInt(e.target.value) || 1) })}
          disabled={readonly}
          className="h-9 text-sm text-center"
          min={1}
          max={99}
          aria-label="Serie"
          placeholder="Serie"
        />
      </div>

      {/* Reps */}
      <div className="w-24 shrink-0">
        <Input
          value={exercise.reps}
          onChange={(e) => onUpdate({ reps: e.target.value })}
          disabled={readonly}
          className="h-9 text-sm text-center"
          aria-label="Ripetizioni"
          placeholder="Rip."
        />
      </div>

      {/* Load */}
      <div className="w-24 shrink-0">
        <Input
          value={exercise.load || ""}
          onChange={(e) => onUpdate({ load: e.target.value })}
          disabled={readonly}
          className="h-9 text-sm text-center"
          aria-label="Carico"
          placeholder="Carico"
        />
      </div>

      {/* Rest */}
      <div className="w-24 shrink-0">
        <Input
          value={exercise.rest || ""}
          onChange={(e) => onUpdate({ rest: e.target.value })}
          disabled={readonly}
          className="h-9 text-sm text-center"
          aria-label="Recupero"
          placeholder="Rec."
        />
      </div>

      {/* Notes Popover */}
      <Popover open={notesOpen} onOpenChange={setNotesOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={hasNotesOrGoals ? "default" : "ghost"}
            size="icon"
            className="h-9 w-9 shrink-0 relative"
            aria-label="Note e obiettivi"
          >
            <StickyNote className="h-4 w-4" />
            {hasNotesOrGoals && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-foreground">
                Obiettivo
              </Label>
              <Input
                value={exercise.goal || ""}
                onChange={(e) => onUpdate({ goal: e.target.value })}
                placeholder="Es. Controllo eccentrico"
                disabled={readonly}
                className="h-9 text-sm"
                maxLength={120}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-foreground">
                Note
              </Label>
              <Textarea
                value={exercise.notes || ""}
                onChange={(e) => onUpdate({ notes: e.target.value })}
                placeholder="Note aggiuntive per l'esecuzione..."
                disabled={readonly}
                className="min-h-[80px] text-sm resize-none"
                maxLength={240}
              />
              <div className="text-xs text-muted-foreground text-right">
                {(exercise.notes || "").length}/240
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Actions Menu */}
      {!readonly && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Altre azioni"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate} className="gap-2 cursor-pointer">
              <Copy className="h-4 w-4" />
              Duplica esercizio
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Elimina esercizio
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
