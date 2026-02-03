import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addCategory,
  removeCategory,
  categoryExists,
  validateCategory,
  DEFAULT_SUGGESTED_CATEGORIES,
} from "@/lib/categories";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CategoryMultiSelectProps {
  value: string[];
  onChange: (categories: string[]) => void;
  suggestedCategories?: string[];
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  className?: string;
}

export function CategoryMultiSelect({
  value,
  onChange,
  suggestedCategories = DEFAULT_SUGGESTED_CATEGORIES,
  placeholder = "Es: Forza, Ipertrofia...",
  disabled = false,
  readonly = false,
  className,
}: CategoryMultiSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isInteractive = !disabled && !readonly;

  const handleAddCategory = (category: string) => {
    const validated = validateCategory(category);
    if (validated && !categoryExists(value, validated)) {
      onChange(addCategory(value, validated));
    }
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleRemoveCategory = (category: string) => {
    if (!isInteractive) return;
    onChange(removeCategory(value, category));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isInteractive) return;

    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      handleAddCategory(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      e.preventDefault();
      handleRemoveCategory(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInteractive) {
      inputRef.current?.focus();
      setIsOpen(true);
    }
  };

  // Filter suggestions based on input and already selected
  const filteredSuggestions = suggestedCategories.filter(
    (cat) =>
      !categoryExists(value, cat) &&
      cat.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Popover open={isOpen && isInteractive} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          ref={containerRef}
          onClick={handleContainerClick}
          className={cn(
            "flex flex-wrap items-center gap-1.5 min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            "max-h-20 overflow-y-auto",
            disabled && "cursor-not-allowed opacity-50",
            readonly && "cursor-default bg-muted/50",
            !disabled && !readonly && "cursor-text",
            className
          )}
        >
          {/* Chips */}
          {value.map((category) => (
            <span
              key={category}
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-sm",
                "max-w-[120px] truncate"
              )}
              title={category}
            >
              <span className="truncate">{category}</span>
              {isInteractive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCategory(category);
                  }}
                  className="flex-shrink-0 rounded-full p-0.5 hover:bg-muted-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
                  aria-label={`Rimuovi ${category}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}

          {/* Input */}
          {isInteractive && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder={value.length === 0 ? placeholder : ""}
              className="flex-1 min-w-[80px] bg-transparent outline-none placeholder:text-muted-foreground"
              disabled={disabled}
            />
          )}

          {/* Placeholder when readonly and empty */}
          {readonly && value.length === 0 && (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (containerRef.current?.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
      >
        <div className="max-h-48 overflow-y-auto">
          {filteredSuggestions.length > 0 ? (
            <div className="p-1">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    handleAddCategory(suggestion);
                    setIsOpen(false);
                  }}
                  className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : inputValue ? (
            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  handleAddCategory(inputValue);
                  setIsOpen(false);
                }}
                className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                Crea "{validateCategory(inputValue)}"
              </button>
            </div>
          ) : (
            <div className="p-2 text-sm text-muted-foreground text-center">
              Digita per cercare o creare
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
