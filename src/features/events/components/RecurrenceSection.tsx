import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { AlertCircle, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { generateRecurrenceOccurrences } from "../utils/recurrence";

export interface RecurrenceConfig {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  interval: number;
  weekDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  monthDay?: number;
  endType: "never" | "until" | "count";
  endDate?: string;
  occurrenceCount?: number;
}

interface RecurrenceSectionProps {
  config: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
  startDate: Date;
  maxOccurrences?: number;
  onMaxOccurrencesExceeded?: () => void;
}

const weekDayLabels = ["D", "L", "M", "M", "G", "V", "S"];

export function RecurrenceSection({ config, onChange, startDate, maxOccurrences, onMaxOccurrencesExceeded }: RecurrenceSectionProps) {
  const [previewDates, setPreviewDates] = useState<Date[]>([]);

  const updateConfig = (updates: Partial<RecurrenceConfig>) => {
    const newConfig = { ...config, ...updates };
    onChange(newConfig);
    calculatePreview(newConfig);
  };

  const calculatePreview = (cfg: RecurrenceConfig) => {
    if (!cfg.enabled) {
      setPreviewDates([]);
      return;
    }

    // Use the same logic as event creation for consistency
    const occurrences = generateRecurrenceOccurrences({
      startDate: startOfDay(startDate),
      config: cfg,
      maxOccurrences: 6, // Show up to 6 dates in preview
    });

    setPreviewDates(occurrences);
  };

  const toggleWeekDay = (day: number) => {
    const current = config.weekDays || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort();
    updateConfig({ weekDays: updated });
  };

  return (
    <div className="space-y-4">
      {/* SINGLE CONTAINER with header + toggle */}
      <div className="p-3.5 rounded-xl border border-border bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="recurrence-toggle" className="text-sm font-semibold leading-tight">
            Rendi ricorrente questo appuntamento
          </Label>
          <Switch
            id="recurrence-toggle"
            checked={config.enabled}
            onCheckedChange={(enabled) => updateConfig({ enabled })}
          />
        </div>

        {!config.enabled && (
          <p className="text-xs text-muted-foreground">
            Attiva per creare una serie di appuntamenti ricorrenti
          </p>
        )}

        {config.enabled && (
          <div className="space-y-4 pt-4 border-t border-border/30 mt-3">
            {/* Frequency */}
            <div className="space-y-2">
              <Label>Frequenza</Label>
              <Select
                value={config.frequency}
                onValueChange={(value) => updateConfig({ frequency: value as RecurrenceConfig["frequency"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Giornaliera</SelectItem>
                  <SelectItem value="weekly">Settimanale</SelectItem>
                  <SelectItem value="monthly">Mensile</SelectItem>
                  <SelectItem value="yearly">Annuale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weekly: Day selection */}
            {config.frequency === "weekly" && (
              <div className="space-y-2">
                <Label>Giorni della settimana</Label>
                <div className="flex gap-1">
                  {weekDayLabels.map((label, idx) => {
                    const isActive = config.weekDays?.includes(idx);
                    return (
                      <Button
                        key={idx}
                        type="button"
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => toggleWeekDay(idx)}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* End configuration */}
            <div className="space-y-3">
              <Label>Termina</Label>
              <RadioGroup value={config.endType} onValueChange={(value) => updateConfig({ endType: value as RecurrenceConfig["endType"] })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="never" />
                  <Label htmlFor="never" className="font-normal cursor-pointer">Mai</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="until" id="until" />
                  <Label htmlFor="until" className="font-normal cursor-pointer">Il giorno</Label>
                </div>
                {config.endType === "until" && (
                  <div className="ml-6 mt-2">
                    <Input
                      type="date"
                      value={config.endDate || ""}
                      onChange={(e) => updateConfig({ endDate: e.target.value })}
                      className="w-full max-w-[200px]"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="count" id="count" />
                  <Label htmlFor="count" className="font-normal cursor-pointer">Dopo</Label>
                </div>
                {config.endType === "count" && (
                  <div className="ml-6 mt-2 flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="52"
                      value={config.occurrenceCount || 10}
                      onChange={(e) => {
                        const value = Math.min(52, Math.max(1, parseInt(e.target.value) || 10));
                        updateConfig({ occurrenceCount: value });
                      }}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">occorrenze</span>
                  </div>
                )}
              </RadioGroup>
            </div>

            {/* Preview */}
            {previewDates.length > 0 && (
              <div className="pt-3 border-t border-border/30">
                <Label className="text-xs text-muted-foreground mb-2 block">Anteprima prossime date</Label>
                <div className="flex flex-wrap gap-1">
                  {previewDates.map((date, i) => (
                    <Badge key={i} variant="secondary" className="text-xs h-6 px-2">
                      {format(date, "d MMM", { locale: it })}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Alert variant="default" className="mt-3">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Gli appuntamenti ricorrenti seguiranno la tua disponibilità. Se uno slot non è disponibile, verrà saltato.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
