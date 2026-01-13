import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  const hasContent = value.trim().length > 0;

  // Sync editValue when value changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      } else if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        );
      }
    }
  }, [isEditing, multiline]);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (multiline && e.shiftKey) {
        // Allow Shift+Enter for newline in multiline
        return;
      }
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value); // Reset to original
      setIsEditing(false);
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
        group h-8 flex items-center px-1.5 min-w-0 overflow-hidden
        ${disabled ? "cursor-default" : "cursor-text hover:bg-muted/40"}
        transition-colors rounded
      `}
    >
      {hasContent ? (
        <span className="text-sm text-muted-foreground truncate">{value}</span>
      ) : (
        <span className="text-xs text-transparent group-hover:text-muted-foreground/50 transition-colors">
          {emptyHint}
        </span>
      )}
    </div>
  );

  // EDIT mode - Notion-like: inline expansion, row grows naturally
  if (isEditing) {
    return (
      <div className="min-w-0" data-testid={testId}>
        {multiline ? (
          <Textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || emptyHint}
            maxLength={maxLength}
            disabled={disabled}
            className="min-h-[72px] max-h-[160px] text-sm resize-none bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0 px-1.5 py-1"
            data-testid={`${testId}-textarea`}
          />
        ) : (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || emptyHint}
            maxLength={maxLength}
            disabled={disabled}
            className="h-8 text-sm bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0 px-1.5"
            data-testid={`${testId}-input`}
          />
        )}
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