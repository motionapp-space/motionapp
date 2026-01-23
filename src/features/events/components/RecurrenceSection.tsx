import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, startOfDay, getDay } from "date-fns";
import { it } from "date-fns/locale";
import { Info } from "lucide-react";
import { generateRecurrenceOccurrences } from "../utils/recurrence";

export interface RecurrenceConfig {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  interval: number;
  weekDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  monthDay?: number;
  endType: "until" | "count"; // Rimosso "never"
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
  const [wasEnabledBefore, setWasEnabledBefore] = useState(false);
  const [occurrenceInputValue, setOccurrenceInputValue] = useState<string>(
    String(config.occurrenceCount || 4)
  );

  // Sincronizza quando il valore esterno cambia
  useEffect(() => {
    setOccurrenceInputValue(String(config.occurrenceCount || 4));
  }, [config.occurrenceCount]);

  const updateConfig = (updates: Partial<RecurrenceConfig>) => {
    const newConfig = { ...config, ...updates };
    onChange(newConfig);
  };

  // Pre-selezione automatica del giorno della settimana quando si attiva la ricorrenza
  useEffect(() => {
    if (config.enabled && !wasEnabledBefore) {
      // Ricorrenza appena attivata - preseleziona il giorno corrente
      const dayOfWeek = getDay(startDate); // 0=Sun, 1=Mon, ..., 6=Sat
      
      // Se non ci sono già giorni selezionati, aggiungi quello corrente
      if (!config.weekDays || config.weekDays.length === 0) {
        updateConfig({ weekDays: [dayOfWeek] });
      }
      setWasEnabledBefore(true);
    } else if (!config.enabled && wasEnabledBefore) {
      setWasEnabledBefore(false);
    }
  }, [config.enabled, startDate, wasEnabledBefore]);

  // Auto-imposta monthDay quando la frequenza cambia a "monthly"
  useEffect(() => {
    if (config.frequency === "monthly" && config.enabled) {
      const dayOfMonth = startDate.getDate();
      if (config.monthDay !== dayOfMonth) {
        updateConfig({ monthDay: dayOfMonth });
      }
    }
  }, [config.frequency, config.enabled, startDate]);

  // Calcolo occorrenze totali per il riepilogo live
  const allOccurrences = useMemo(() => {
    if (!config.enabled) return [];
    return generateRecurrenceOccurrences({
      startDate: startOfDay(startDate),
      config: config,
      maxOccurrences: 52, // Max 1 anno di occorrenze settimanali
    });
  }, [config, startDate]);

  // Ricalcola anteprima quando cambia la config
  useEffect(() => {
    if (!config.enabled) {
      setPreviewDates([]);
      return;
    }
    // Mostra solo le prime 6 per l'anteprima visiva
    setPreviewDates(allOccurrences.slice(0, 6));
  }, [config.enabled, allOccurrences]);

  const toggleWeekDay = (day: number) => {
    const current = config.weekDays || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort();
    updateConfig({ weekDays: updated });
  };

  // Ultima data della serie
  const lastOccurrenceDate = allOccurrences.length > 0 
    ? allOccurrences[allOccurrences.length - 1] 
    : null;

  return (
    <div className="pt-4 space-y-3">
      {/* Header with toggle aligned right - decision section style */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="recurrence-toggle" className="text-[15px] font-semibold text-foreground leading-none cursor-pointer">
            Ricorrenza
          </Label>
          {!config.enabled && (
            <p className="text-[13px] text-muted-foreground max-w-[420px]">
              Attiva per creare una serie di appuntamenti
            </p>
          )}
        </div>
        <Switch
          id="recurrence-toggle"
          checked={config.enabled}
          onCheckedChange={(enabled) => updateConfig({ enabled })}
        />
      </div>

      {/* Recurrence options - compact when enabled */}
      {config.enabled && (
        <div className="space-y-4">
            {/* Frequency */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Frequenza</Label>
              <Select
                value={config.frequency}
                onValueChange={(value) => updateConfig({ frequency: value as RecurrenceConfig["frequency"] })}
              >
                <SelectTrigger className="h-10">
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
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">Giorni della settimana</Label>
                <div className="flex gap-1">
                  {weekDayLabels.map((label, idx) => {
                    const isActive = config.weekDays?.includes(idx);
                    return (
                      <Button
                        key={idx}
                        type="button"
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0 text-sm"
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
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Termina</Label>
              <RadioGroup 
                value={config.endType} 
                onValueChange={(value) => updateConfig({ endType: value as RecurrenceConfig["endType"] })}
                className="space-y-2"
              >
                {/* Opzione: Dopo N occorrenze */}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="count" id="count" />
                  <Label htmlFor="count" className="font-normal cursor-pointer text-sm">Dopo</Label>
                </div>
                {config.endType === "count" && (
                  <div className="ml-6 flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="52"
                      value={occurrenceInputValue}
                      onChange={(e) => {
                        setOccurrenceInputValue(e.target.value);
                      }}
                      onBlur={() => {
                        const parsed = parseInt(occurrenceInputValue);
                        const validValue = isNaN(parsed) ? 4 : Math.min(52, Math.max(1, parsed));
                        setOccurrenceInputValue(String(validValue));
                        updateConfig({ occurrenceCount: validValue });
                      }}
                      className="w-20 h-9"
                    />
                    <span className="text-sm text-muted-foreground">occorrenze</span>
                  </div>
                )}

                {/* Opzione: Fino a data */}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="until" id="until" />
                  <Label htmlFor="until" className="font-normal cursor-pointer text-sm">Il giorno</Label>
                </div>
                {config.endType === "until" && (
                  <div className="ml-6">
                    <Input
                      type="date"
                      value={config.endDate || ""}
                      onChange={(e) => updateConfig({ endDate: e.target.value })}
                      className="w-full max-w-[180px] h-9"
                    />
                  </div>
                )}
              </RadioGroup>
            </div>

            {/* Riepilogo live occorrenze */}
            {allOccurrences.length > 0 && lastOccurrenceDate && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[13px] font-medium text-foreground">
                  Questa serie creerà {allOccurrences.length} appuntament{allOccurrences.length === 1 ? 'o' : 'i'}
                  <span className="text-muted-foreground font-normal">
                    {" "}(ultimo il {format(lastOccurrenceDate, "d MMM yyyy", { locale: it })})
                  </span>
                </p>
              </div>
            )}

            {/* Preview - compact */}
            {previewDates.length > 0 && (
              <div className="pt-3 border-t border-border/30">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Anteprima date</Label>
                <div className="flex flex-wrap gap-1">
                  {previewDates.map((date, i) => (
                    <Badge key={i} variant="secondary" className="text-xs h-5 px-2">
                      {format(date, "d MMM", { locale: it })}
                    </Badge>
                  ))}
                  {allOccurrences.length > 6 && (
                    <Badge variant="outline" className="text-xs h-5 px-2">
                      +{allOccurrences.length - 6}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <Alert variant="default" className="mt-3 py-2">
              <Info className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">
                Se uno slot non è disponibile, verrà saltato.
              </AlertDescription>
            </Alert>
          </div>
        )}
    </div>
  );
}
