import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TimePicker } from "@/components/ui/time-picker";
import { Plus, MoreVertical, Copy, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAvailabilityWindowsQuery } from "../hooks/useAvailability";
import type { CreateAvailabilityWindowInput } from "../types";

const DAYS_OF_WEEK = [
  { key: 0, label: "Lunedì" },
  { key: 1, label: "Martedì" },
  { key: 2, label: "Mercoledì" },
  { key: 3, label: "Giovedì" },
  { key: 4, label: "Venerdì" },
  { key: 5, label: "Sabato" },
  { key: 6, label: "Domenica" },
];

interface TimeRange {
  start_time: string;
  end_time: string;
  temp_id?: string;
}

interface AvailabilityEditorProps {
  onChangeDetected?: () => void;
  onResetRequested?: () => void;
  localChangesRef?: React.MutableRefObject<Record<number, TimeRange[]>>;
}

// Helper to format time without seconds (HH:mm:ss → HH:mm)
const formatTimeDisplay = (time: string): string => {
  return time.substring(0, 5);
};

// Helper to validate time range (end must be after start, no cross-midnight)
const isValidTimeRange = (start: string, end: string): boolean => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return endMinutes > startMinutes;
};

export function AvailabilityEditor({
  onChangeDetected, 
  onResetRequested,
  localChangesRef 
}: AvailabilityEditorProps) {
  const { data: windows = [], isLoading } = useAvailabilityWindowsQuery();

  const [editMode, setEditMode] = useState<Record<number, TimeRange[]>>({});

  // Sync local changes with parent ref
  if (localChangesRef) {
    localChangesRef.current = editMode;
  }

  // Reset handler
  if (onResetRequested && Object.keys(editMode).length > 0) {
    setEditMode({});
  }

  const getWindowsForDay = (dayOfWeek: number): TimeRange[] => {
    if (editMode[dayOfWeek]) return editMode[dayOfWeek];
    
    return windows
      .filter((w) => w.day_of_week === dayOfWeek)
      .map((w) => ({
        start_time: w.start_time,
        end_time: w.end_time,
        temp_id: w.id,
      }));
  };

  const addTimeRange = (dayOfWeek: number) => {
    const currentRanges = getWindowsForDay(dayOfWeek);
    setEditMode({
      ...editMode,
      [dayOfWeek]: [
        ...currentRanges,
        { start_time: "09:00", end_time: "17:00", temp_id: `new-${Date.now()}` },
      ],
    });
    onChangeDetected?.();
  };

  const removeTimeRange = (dayOfWeek: number, index: number) => {
    const currentRanges = getWindowsForDay(dayOfWeek);
    const newRanges = currentRanges.filter((_, i) => i !== index);
    setEditMode({
      ...editMode,
      [dayOfWeek]: newRanges,
    });
    onChangeDetected?.();
  };

  const updateTimeRange = (
    dayOfWeek: number,
    index: number,
    field: "start_time" | "end_time",
    value: string
  ) => {
    const currentRanges = getWindowsForDay(dayOfWeek);
    const updated = [...currentRanges];
    const newRange = { ...updated[index], [field]: value };
    
    // Validate the new time range
    if (!isValidTimeRange(newRange.start_time, newRange.end_time)) {
      toast.error("Orario non valido", {
        description: "L'orario di fine deve essere successivo all'orario di inizio. Le fasce che attraversano mezzanotte non sono supportate.",
      });
      return; // Don't apply invalid change
    }
    
    updated[index] = newRange;
    setEditMode({ ...editMode, [dayOfWeek]: updated });
    onChangeDetected?.();
  };


  const copyToOtherDays = (sourceDayOfWeek: number) => {
    const sourceRanges = getWindowsForDay(sourceDayOfWeek);
    if (sourceRanges.length === 0) return;

    const newEditMode = { ...editMode };
    for (const day of DAYS_OF_WEEK) {
      if (day.key === sourceDayOfWeek) continue;
      newEditMode[day.key] = sourceRanges.map((r) => ({
        ...r,
        temp_id: `new-${Date.now()}-${day.key}`,
      }));
    }
    setEditMode(newEditMode);
    onChangeDetected?.();
  };

  const deleteAllSlots = (dayOfWeek: number) => {
    setEditMode({
      ...editMode,
      [dayOfWeek]: [],
    });
    onChangeDetected?.();
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Caricamento disponibilità...</div>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* Compact table */}
        <div className="border rounded-lg overflow-hidden">
        <div className="divide-y">
          {DAYS_OF_WEEK.map((day) => {
            const ranges = getWindowsForDay(day.key);

            return (
              <div key={day.key} className="bg-card">
                {/* Day row with inline time pickers */}
                <div className="flex items-center gap-3 p-3">
                  {/* Day name */}
                  <div className="w-28 font-medium text-sm">{day.label}</div>

                  {/* Inline time slots with pickers */}
                  <div className="flex-1 flex flex-wrap gap-3 items-center">
                    {ranges.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Nessuna disponibilità</span>
                    ) : (
                      ranges.map((range, index) => {
                        const isInvalid = !isValidTimeRange(range.start_time, range.end_time);
                        return (
                          <div key={range.temp_id || index} className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`flex items-center gap-2 ${isInvalid ? 'opacity-50' : ''}`}>
                                  <div className="w-24">
                                    <TimePicker
                                      value={range.start_time}
                                      onChange={(value) =>
                                        updateTimeRange(day.key, index, "start_time", value)
                                      }
                                    />
                                  </div>
                                  <span className="text-muted-foreground text-sm">—</span>
                                  <div className="w-24">
                                    <TimePicker
                                      value={range.end_time}
                                      onChange={(value) =>
                                        updateTimeRange(day.key, index, "end_time", value)
                                      }
                                    />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              {isInvalid && (
                                <TooltipContent>
                                  <p className="text-xs flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Fascia oraria non valida: attraversa mezzanotte
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTimeRange(day.key, index)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addTimeRange(day.key)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => copyToOtherDays(day.key)}
                          disabled={ranges.length === 0}
                        >
                          <Copy className="h-4 w-4" />
                          Copia ad altri giorni
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteAllSlots(day.key)}
                          disabled={ranges.length === 0}
                        >
                          <Trash2 className="h-4 w-4" />
                          Elimina tutte le fasce
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
}
