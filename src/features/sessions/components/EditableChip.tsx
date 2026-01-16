import { cn } from "@/lib/utils";

interface EditableChipProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "text" | "numeric";
  className?: string;
}

export function EditableChip({
  label,
  value,
  onChange,
  placeholder,
  inputMode = "text",
  className,
}: EditableChipProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <label className="text-[11px] text-muted-foreground uppercase tracking-[0.04em]">
        {label}
      </label>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 px-3 text-[14px] font-medium rounded-full border border-input bg-background w-20 text-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      />
    </div>
  );
}
