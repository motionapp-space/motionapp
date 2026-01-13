import { Exercise } from "@/types/plan";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, MoreVertical } from "lucide-react";
import { DraggableHandle } from "./DraggableHandle";
import { InlineEditableField } from "./InlineEditableField";
import { useState, useRef, useEffect } from "react";

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
  // Start in edit mode if exercise name is empty (new exercise)
  const [isEditingName, setIsEditingName] = useState(!exercise.name);
  const nameInputRef = useRef<HTMLInputElement>(null);
  // Track focus state independently from re-renders to prevent focus loss
  const isFocusedRef = useRef(false);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  const handleNameFocus = () => {
    isFocusedRef.current = true;
    setIsEditingName(true);
  };

  const handleNameBlur = () => {
    isFocusedRef.current = false;
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape") {
      setIsEditingName(false);
    }
  };

  return (
    <div className="flex flex-col" data-testid="exercise-row">
      {/* Desktop row - 9 columns aligned with header */}
      <div className="hidden sm:grid sm:grid-cols-[32px_minmax(360px,1.6fr)_64px_88px_140px_72px_minmax(110px,0.7fr)_minmax(110px,0.7fr)_40px] items-start gap-1 py-1.5 px-2 border-b border-border/50 hover:bg-muted/45 transition-colors">
        <DraggableHandle
          level="group-exercise"
          disabled={readonly}
          dragHandleProps={dragHandleProps}
        />

        {/* Display-first name: text until clicked, then input */}
        {(isEditingName || !exercise.name || isFocusedRef.current) ? (
          <Input
            ref={nameInputRef}
            value={exercise.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            onFocus={handleNameFocus}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            placeholder="Nome esercizio"
            disabled={readonly}
            className="h-8 text-sm font-medium border border-transparent bg-transparent transition-colors hover:bg-muted/40 focus:bg-muted/50 focus:border-primary/40 focus:ring-0 max-w-[260px] md:max-w-[320px]"
            aria-label="Nome esercizio"
          />
        ) : (
          <div
            onClick={() => !readonly && setIsEditingName(true)}
            className={`h-8 flex items-center text-sm font-medium text-foreground px-3 truncate ${
              readonly ? "cursor-default" : "cursor-text max-w-[260px] md:max-w-[320px]"
            }`}
          >
            {exercise.name}
          </div>
        )}

        <Input
          type="number"
          value={exercise.sets}
          onChange={(e) =>
            onUpdate({ sets: Math.max(1, parseInt(e.target.value) || 1) })
          }
          disabled={readonly}
          className="h-8 text-sm text-left pl-2 border border-transparent bg-transparent transition-colors hover:bg-muted/65 focus:bg-muted/50 focus:border-primary/40 focus:ring-0 disabled:text-foreground disabled:opacity-100"
          min={1}
          max={99}
          aria-label="Serie"
        />

        <Input
          value={exercise.reps}
          onChange={(e) => onUpdate({ reps: e.target.value })}
          disabled={readonly}
          className="h-8 text-sm text-left pl-2 border border-transparent bg-transparent transition-colors hover:bg-muted/65 focus:bg-muted/50 focus:border-primary/40 focus:ring-0 disabled:text-foreground disabled:opacity-100"
          aria-label="Ripetizioni"
          placeholder=""
        />

        {/* Campo Carico con hint hover-only */}
        <div className="relative group">
          <Input
            value={exercise.load || ""}
            onChange={(e) => onUpdate({ load: e.target.value })}
            disabled={readonly}
            className="h-8 text-sm text-left pl-2 border border-transparent bg-transparent transition-colors hover:bg-muted/65 focus:bg-muted/50 focus:border-primary/40 focus:ring-0 disabled:text-foreground disabled:opacity-100"
            aria-label="Carico"
            placeholder=""
          />
          {/* Hint appare solo se vuoto + hover/focus */}
          {!exercise.load && (
            <span className="absolute inset-0 flex items-center pl-2 text-sm text-transparent group-hover:text-muted-foreground/60 group-focus-within:text-muted-foreground/60 transition-colors pointer-events-none">
              es. 12 kg
            </span>
          )}
        </div>

        <Input
          value={exercise.rest || ""}
          onChange={(e) => onUpdate({ rest: e.target.value })}
          disabled={readonly}
          className="h-8 text-sm text-left pl-2 border border-transparent bg-transparent transition-colors hover:bg-muted/65 focus:bg-muted/50 focus:border-primary/40 focus:ring-0 disabled:text-foreground disabled:opacity-100"
          aria-label="Recupero"
          placeholder=""
        />

        {/* Obiettivo column */}
        <InlineEditableField
          label="OBIETTIVO"
          value={exercise.goal ?? ""}
          onChange={(val) => onUpdate({ goal: val })}
          maxLength={120}
          disabled={readonly}
          multiline={false}
          testId="goal-field"
        />

        {/* Note column */}
        <InlineEditableField
          label="NOTE"
          value={exercise.notes ?? ""}
          onChange={(val) => onUpdate({ notes: val })}
          maxLength={240}
          disabled={readonly}
          multiline={true}
          testId="notes-field"
        />

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

      {/* Mobile: 2 rows layout with inline Obiettivo/Note */}
      <div className="sm:hidden py-2 px-2 border-b border-border/50 space-y-2">
        <div className="flex items-center gap-2">
          <DraggableHandle
            level="group-exercise"
            disabled={readonly}
            dragHandleProps={dragHandleProps}
          />
          {/* Mobile: Display-first name */}
          {(isEditingName || !exercise.name || isFocusedRef.current) ? (
            <Input
              value={exercise.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              onFocus={handleNameFocus}
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              placeholder="Nome esercizio"
              disabled={readonly}
              className="flex-1 h-9 text-sm font-medium border-0 bg-transparent focus:bg-muted/20"
              aria-label="Nome esercizio"
            />
          ) : (
            <div
              onClick={() => !readonly && setIsEditingName(true)}
              className="flex-1 h-9 flex items-center text-sm font-medium text-foreground cursor-text truncate"
            >
              {exercise.name}
            </div>
          )}
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
        
        {/* Mobile: Parameters row */}
        <div className="grid grid-cols-4 gap-2 pl-8">
          <Input
            type="number"
            value={exercise.sets}
            onChange={(e) =>
              onUpdate({ sets: Math.max(1, parseInt(e.target.value) || 1) })
            }
            disabled={readonly}
            className="h-9 text-sm text-center border-0 bg-muted/30 disabled:text-foreground disabled:opacity-100"
            placeholder="Serie"
            min={1}
            aria-label="Serie"
          />
          <Input
            value={exercise.reps}
            onChange={(e) => onUpdate({ reps: e.target.value })}
            disabled={readonly}
            className="h-9 text-sm text-center border-0 bg-muted/30 disabled:text-foreground disabled:opacity-100"
            placeholder="Rip"
            aria-label="Ripetizioni"
          />
          <Input
            value={exercise.load || ""}
            onChange={(e) => onUpdate({ load: e.target.value })}
            disabled={readonly}
            className="h-9 text-sm text-center border-0 bg-muted/30 disabled:text-foreground disabled:opacity-100"
            placeholder="Carico"
            aria-label="Carico"
          />
          <Input
            value={exercise.rest || ""}
            onChange={(e) => onUpdate({ rest: e.target.value })}
            disabled={readonly}
            className="h-9 text-sm text-center border-0 bg-muted/30 disabled:text-foreground disabled:opacity-100"
            placeholder="Rec"
            aria-label="Recupero"
          />
        </div>

        {/* Mobile: Obiettivo and Note as compact cells */}
        <div className="grid grid-cols-2 gap-2 pl-8">
          <InlineEditableField
            label="OBIETTIVO"
            value={exercise.goal ?? ""}
            onChange={(val) => onUpdate({ goal: val })}
            maxLength={120}
            disabled={readonly}
            multiline={false}
            testId="goal-field-mobile"
          />
          <InlineEditableField
            label="NOTE"
            value={exercise.notes ?? ""}
            onChange={(val) => onUpdate({ notes: val })}
            maxLength={240}
            disabled={readonly}
            multiline={true}
            testId="notes-field-mobile"
          />
        </div>
      </div>
    </div>
  );
};
