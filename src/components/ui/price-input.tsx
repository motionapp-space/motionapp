import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PriceInputProps {
  value: number;            // valore in centesimi
  onChange: (cents: number) => void;
  onBlur?: () => void;
  className?: string;
  currencySymbol?: string;  // opzionale, default "€"
  allowNegative?: boolean;  // opzionale, default false
}

// Helper per formattare centesimi in stringa leggibile
const formatCentsToString = (cents: number) => {
  const safe = Number.isFinite(cents) ? cents : 0;
  return (safe / 100).toFixed(2).replace(".", ",");
};

export function PriceInput({
  value,
  onChange,
  onBlur,
  className,
  currencySymbol = "€",
  allowNegative = false,
}: PriceInputProps) {
  const [localValue, setLocalValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Sincronizza quando il valore esterno cambia (es. reset form)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(formatCentsToString(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);

    const normalized = raw.replace(",", ".").trim();

    // Permetti campo vuoto mentre l'utente digita
    if (normalized === "" || normalized === "-" || normalized === "+") {
      return;
    }

    const parsed = parseFloat(normalized);
    if (isNaN(parsed)) return;

    if (!allowNegative && parsed < 0) return;

    const cents = Math.round(parsed * 100);
    onChange(cents);
  };

  const handleBlur = () => {
    setIsFocused(false);

    const normalized = localValue.replace(",", ".").trim();
    const parsed = parseFloat(normalized);

    if (!isNaN(parsed) && (allowNegative || parsed >= 0)) {
      const cents = Math.round(parsed * 100);
      onChange(cents);
      setLocalValue(formatCentsToString(cents));
    } else {
      const fallback = 0;
      onChange(fallback);
      setLocalValue(formatCentsToString(fallback));
    }

    onBlur?.();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const pattern = allowNegative
    ? "^[-]?\\d+([.,]\\d{0,2})?$"
    : "^\\d+([.,]\\d{0,2})?$";

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="decimal"
        pattern={pattern}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn("pr-8", className)}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        {currencySymbol}
      </span>
    </div>
  );
}
