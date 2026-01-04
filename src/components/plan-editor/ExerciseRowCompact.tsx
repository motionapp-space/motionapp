import { Exercise } from "@/types/plan";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Trash2, StickyNote, MoreVertical } from "lucide-react";
import { DraggableHandle } from "./DraggableHandle";
import { useState } from "react";

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
  const [notesExpanded, setNotesExpanded] = useState(false);

  const hasNotesOrGoals = Boolean(
    (exercise.notes && exercise.notes.trim()) ||
      (exercise.goal && exercise.goal.trim())
  );

  return (
    <div className="flex flex-col">
      {/* Desktop row */}
      <div className="hidden sm:grid sm:grid-cols-[32px_1fr_60px_60px_70px_60px_40px_40px] items-center gap-1 py-1.5 px-2 border-b border-border/50 hover:bg-muted/30 transition-colors">
        <DraggableHandle
          level="group-exercise"
          disabled={readonly}
          dragHandleProps={dragHandleProps}
        />

        <Input
          value={exercise.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nome esercizio"
          disabled={readonly}
          className="h-8 text-sm font-medium border-0 bg-transparent focus:bg-muted/20 focus:ring-1 focus:ring-primary/30"
          aria-label="Nome esercizio"
        />

        <Input
          type="number"
          value={exercise.sets}
          onChange={(e) =>
            onUpdate({ sets: Math.max(1, parseInt(e.target.value) || 1) })
          }
          disabled={readonly}
          className="h-8 text-sm text-center border-0 bg-transparent focus:bg-muted/20 focus:ring-1 focus:ring-primary/30"
          min={1}
          max={99}
          aria-label="Serie"
        />

        <Input
          value={exercise.reps}
          onChange={(e) => onUpdate({ reps: e.target.value })}
          disabled={readonly}
          className="h-8 text-sm text-center border-0 bg-transparent focus:bg-muted/20 focus:ring-1 focus:ring-primary/30"
          aria-label="Ripetizioni"
          placeholder="Rip"
        />

        <Input
          value={exercise.load || ""}
          onChange={(e) => onUpdate({ load: e.target.value })}
          disabled={readonly}
          className="h-8 text-sm text-center border-0 bg-transparent focus:bg-muted/20 focus:ring-1 focus:ring-primary/30"
          aria-label="Carico"
          placeholder="Carico"
        />

        <Input
          value={exercise.rest || ""}
          onChange={(e) => onUpdate({ rest: e.target.value })}
          disabled={readonly}
          className="h-8 text-sm text-center border-0 bg-transparent focus:bg-muted/20 focus:ring-1 focus:ring-primary/30"
          aria-label="Recupero"
          placeholder="Rec"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setNotesExpanded(!notesExpanded)}
          className={`h-8 w-8 ${hasNotesOrGoals ? "text-primary" : "text-muted-foreground"}`}
          aria-label="Note e obiettivi"
        >
          <StickyNote className="h-4 w-4" />
        </Button>

        {!readonly ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                aria-label="Altre azioni"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDuplicate} className="gap-2 cursor-pointer">
                <Copy className="h-4 w-4" />
                Duplica
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Mobile: 2 rows layout */}
      <div className="sm:hidden py-2 px-2 border-b border-border/50 space-y-2">
        <div className="flex items-center gap-2">
          <DraggableHandle
            level="group-exercise"
            disabled={readonly}
            dragHandleProps={dragHandleProps}
          />
          <Input
            value={exercise.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Nome esercizio"
            disabled={readonly}
            className="flex-1 h-9 text-sm font-medium border-0 bg-transparent focus:bg-muted/20"
            aria-label="Nome esercizio"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotesExpanded(!notesExpanded)}
            className={`h-9 w-9 ${hasNotesOrGoals ? "text-primary" : "text-muted-foreground"}`}
            aria-label="Note"
          >
            <StickyNote className="h-4 w-4" />
          </Button>
          {!readonly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground"
                  aria-label="Azioni"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDuplicate} className="gap-2 cursor-pointer">
                  <Copy className="h-4 w-4" />
                  Duplica
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Elimina
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2 pl-8">
          <Input
            type="number"
            value={exercise.sets}
            onChange={(e) =>
              onUpdate({ sets: Math.max(1, parseInt(e.target.value) || 1) })
            }
            disabled={readonly}
            className="h-9 text-sm text-center border-0 bg-muted/30"
            placeholder="Serie"
            min={1}
            aria-label="Serie"
          />
          <Input
            value={exercise.reps}
            onChange={(e) => onUpdate({ reps: e.target.value })}
            disabled={readonly}
            className="h-9 text-sm text-center border-0 bg-muted/30"
            placeholder="Rip"
            aria-label="Ripetizioni"
          />
          <Input
            value={exercise.load || ""}
            onChange={(e) => onUpdate({ load: e.target.value })}
            disabled={readonly}
            className="h-9 text-sm text-center border-0 bg-muted/30"
            placeholder="Carico"
            aria-label="Carico"
          />
          <Input
            value={exercise.rest || ""}
            onChange={(e) => onUpdate({ rest: e.target.value })}
            disabled={readonly}
            className="h-9 text-sm text-center border-0 bg-muted/30"
            placeholder="Rec"
            aria-label="Recupero"
          />
        </div>
      </div>

      {/* Notes inline expand */}
      {notesExpanded && (
        <div className="px-2 py-3 bg-muted/20 border-b border-border/50 space-y-3">
          <div className="sm:pl-8">
            <Input
              value={exercise.goal || ""}
              onChange={(e) => onUpdate({ goal: e.target.value })}
              placeholder="Obiettivo (es. Controllo eccentrico)"
              disabled={readonly}
              className="h-9 text-sm border-0 bg-background/50 focus:bg-background"
              maxLength={120}
            />
          </div>
          <div className="sm:pl-8">
            <Textarea
              value={exercise.notes || ""}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Note aggiuntive..."
              disabled={readonly}
              className="min-h-[60px] text-sm resize-none border-0 bg-background/50 focus:bg-background"
              maxLength={240}
            />
            <div className="text-xs text-muted-foreground text-right mt-1">
              {(exercise.notes || "").length}/240
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
