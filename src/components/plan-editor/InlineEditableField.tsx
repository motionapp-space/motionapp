import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useIsMobile } from "@/hooks/use-mobile";

interface InlineEditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  multiline?: boolean;
  previewOnHover?: boolean;
  testId?: string;
}

// Classi unificate - match "Nome esercizio" field
const CELL_TEXT_CLASS = "text-sm text-muted-foreground truncate";
const CELL_HINT_CLASS = "text-sm text-transparent group-hover:text-muted-foreground/60 transition-colors";
const EDITOR_CLASS = "min-h-[72px] max-h-[160px] text-sm text-foreground resize-none bg-transparent border border-transparent transition-colors hover:bg-muted/40 focus:border-primary/40 focus:ring-0 focus:outline-none px-3 py-1.5 rounded-md placeholder:text-muted-foreground/60";

export const InlineEditableField = ({
  label,
  value,
  onChange,
  placeholder = "",
  maxLength,
  disabled = false,
  multiline = false,
  previewOnHover = true,
  testId,
}: InlineEditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  const hasContent = value.trim().length > 0;

  // Sync editValue when value changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (multiline && e.shiftKey) {
        // Allow Shift+Enter for newline in multiline only
        return;
      }
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value); // Reset to original
      setIsEditing(false);
    }
  };

  // Block newline insertion for non-multiline fields
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleClick = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  // Placeholder hint for empty fields
  const emptyHint = multiline ? "Aggiungi note" : "Aggiungi obiettivo";

  // READ mode cell content - Notion-like: no label, just value or empty with hover hint
  const readContent = (
    <div
      data-testid={testId}
      onClick={handleClick}
      className={`
        group h-8 flex items-center px-3 min-w-0 overflow-hidden
        ${disabled ? "cursor-default" : "cursor-text hover:bg-muted/65"}
        transition-colors rounded-md
      `}
    >
      {hasContent ? (
        <span className={CELL_TEXT_CLASS}>{value}</span>
      ) : (
        <span className={CELL_HINT_CLASS}>
          {emptyHint}
        </span>
      )}
    </div>
  );

  // EDIT mode - ALWAYS use Textarea for row expansion (Notion-like)
  if (isEditing) {
    return (
      <div className="min-w-0 rounded-md" data-testid={testId}>
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || emptyHint}
          maxLength={maxLength}
          disabled={disabled}
          className={EDITOR_CLASS}
          data-testid={`${testId}-textarea`}
        />
      </div>
    );
  }

  // Desktop with HoverCard - only for truncated content in READ mode
  if (!isMobile && previewOnHover && hasContent) {
    return (
      <HoverCard openDelay={150} closeDelay={100}>
        <HoverCardTrigger asChild>{readContent}</HoverCardTrigger>
        <HoverCardContent
          side="top"
          align="start"
          className="w-[360px] max-w-[90vw] z-[100]"
          data-testid={`${testId}-overlay`}
        >
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="text-sm whitespace-pre-wrap break-words">{value}</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Default: just the read content
  return readContent;
};