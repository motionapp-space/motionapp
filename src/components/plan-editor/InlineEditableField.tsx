import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
  previewOnTap?: boolean;
  emptyDisplay?: string;
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
  previewOnTap = true,
  emptyDisplay = "—",
  testId,
}: InlineEditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  const hasContent = value.trim().length > 0;
  const displayValue = hasContent ? value : emptyDisplay;

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

    if (isMobile && previewOnTap) {
      setDrawerOpen(true);
    } else {
      setIsEditing(true);
    }
  };

  const handleDrawerEditStart = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleDrawerSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleDrawerClose = () => {
    if (isEditing) {
      onChange(editValue);
    }
    setIsEditing(false);
    setDrawerOpen(false);
  };

  // READ mode cell content
  const readContent = (
    <div
      data-testid={testId}
      onClick={handleClick}
      className={`
        h-8 flex items-center gap-1 px-1.5 min-w-0 overflow-hidden
        ${disabled ? "cursor-default" : "cursor-text hover:bg-muted/40"}
        transition-colors rounded
      `}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground shrink-0">
        {label}:
      </span>
      <span className="text-sm text-muted-foreground truncate">
        {displayValue}
      </span>
    </div>
  );

  // EDIT mode content (desktop inline)
  if (isEditing && !isMobile) {
    return (
      <div className="min-w-0">
        {multiline ? (
          <Textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className="min-h-[32px] max-h-[160px] text-sm resize-none border-primary/40 bg-muted/50 focus:bg-background"
            data-testid={`${testId}-textarea`}
          />
        ) : (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className="h-8 text-sm border-primary/40 bg-muted/50 focus:bg-background"
            data-testid={`${testId}-input`}
          />
        )}
      </div>
    );
  }

  // Desktop with HoverCard
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
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="text-sm whitespace-pre-wrap break-words">{value}</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Mobile with Drawer
  if (isMobile) {
    return (
      <>
        {readContent}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{label}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6">
              {isEditing ? (
                <div className="space-y-3">
                  {multiline ? (
                    <Textarea
                      ref={textareaRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={placeholder}
                      maxLength={maxLength}
                      disabled={disabled}
                      className="min-h-[120px] max-h-[200px] text-sm resize-none"
                      data-testid={`${testId}-textarea`}
                      autoFocus
                    />
                  ) : (
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={placeholder}
                      maxLength={maxLength}
                      disabled={disabled}
                      className="h-10 text-sm"
                      data-testid={`${testId}-input`}
                      autoFocus
                    />
                  )}
                  {maxLength && (
                    <div className="text-xs text-muted-foreground text-right">
                      {editValue.length}/{maxLength}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setEditValue(value);
                        setIsEditing(false);
                      }}
                      className="flex-1 h-10 rounded-md border border-input bg-background text-sm hover:bg-muted"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={handleDrawerSave}
                      className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
                    >
                      Salva
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm whitespace-pre-wrap min-h-[48px]">
                    {hasContent ? value : <span className="text-muted-foreground italic">Nessun contenuto</span>}
                  </p>
                  {!disabled && (
                    <button
                      onClick={handleDrawerEditStart}
                      className="w-full h-10 rounded-md border border-input bg-background text-sm hover:bg-muted"
                    >
                      Modifica
                    </button>
                  )}
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Default: just the read content (no hover, no content)
  return readContent;
};
