import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Copy, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAvailabilityWindowsQuery,
  useCreateAvailabilityWindow,
  useDeleteAvailabilityWindow,
  useBulkCreateAvailabilityWindows,
} from "../hooks/useAvailability";
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
}

export function AvailabilityEditor({ onChangeDetected }: AvailabilityEditorProps) {
  const { data: windows = [], isLoading } = useAvailabilityWindowsQuery();
  const createMutation = useCreateAvailabilityWindow();
  const deleteMutation = useDeleteAvailabilityWindow();
  const bulkCreateMutation = useBulkCreateAvailabilityWindows();

  const [editMode, setEditMode] = useState<Record<number, TimeRange[]>>({});
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

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
    // Only set expanded if not already expanded
    if (expandedDay !== dayOfWeek) {
      setExpandedDay(dayOfWeek);
    }
    onChangeDetected?.();
  };

  const removeTimeRange = async (dayOfWeek: number, index: number) => {
    const currentRanges = getWindowsForDay(dayOfWeek);
    const rangeToRemove = currentRanges[index];
    
    if (rangeToRemove.temp_id?.startsWith("new-")) {
      const newRanges = currentRanges.filter((_, i) => i !== index);
      setEditMode({
        ...editMode,
        [dayOfWeek]: newRanges,
      });
    } else {
      await deleteMutation.mutateAsync(rangeToRemove.temp_id!);
    }
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
    updated[index] = { ...updated[index], [field]: value };
    setEditMode({ ...editMode, [dayOfWeek]: updated });
    onChangeDetected?.();
  };

  const saveDay = async (dayOfWeek: number) => {
    const ranges = editMode[dayOfWeek] || getWindowsForDay(dayOfWeek);
    
    const existingIds = windows
      .filter((w) => w.day_of_week === dayOfWeek)
      .map((w) => w.id);
    
    for (const id of existingIds) {
      await deleteMutation.mutateAsync(id);
    }
    
    const inputs: CreateAvailabilityWindowInput[] = ranges.map((r) => ({
      day_of_week: dayOfWeek,
      start_time: r.start_time,
      end_time: r.end_time,
    }));
    
    await bulkCreateMutation.mutateAsync(inputs);
    
    const newEditMode = { ...editMode };
    delete newEditMode[dayOfWeek];
    setEditMode(newEditMode);
    setExpandedDay(null);
  };

  const copyToOtherDays = async (sourceDayOfWeek: number) => {
    const sourceRanges = getWindowsForDay(sourceDayOfWeek);
    
    for (let day = 0; day < 7; day++) {
      if (day !== sourceDayOfWeek) {
        const existingIds = windows
          .filter((w) => w.day_of_week === day)
          .map((w) => w.id);
        
        for (const id of existingIds) {
          await deleteMutation.mutateAsync(id);
        }
        
        const inputs: CreateAvailabilityWindowInput[] = sourceRanges.map((r) => ({
          day_of_week: day,
          start_time: r.start_time,
          end_time: r.end_time,
        }));
        
        if (inputs.length > 0) {
          await bulkCreateMutation.mutateAsync(inputs);
        }
      }
    }
  };

  const deleteAllSlots = async (dayOfWeek: number) => {
    const existingIds = windows
      .filter((w) => w.day_of_week === dayOfWeek)
      .map((w) => w.id);
    
    for (const id of existingIds) {
      await deleteMutation.mutateAsync(id);
    }
    
    const newEditMode = { ...editMode };
    delete newEditMode[dayOfWeek];
    setEditMode(newEditMode);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Caricamento disponibilità...</div>;
  }

  return (
    <div className="space-y-2">
      {/* Compact table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="divide-y">
          {DAYS_OF_WEEK.map((day) => {
            const ranges = getWindowsForDay(day.key);
            const hasChanges = !!editMode[day.key];
            const isExpanded = expandedDay === day.key;

            return (
              <div key={day.key} className="bg-card">
                {/* Day row */}
                <div className="flex items-center gap-3 p-3">
                  {/* Day name */}
                  <div className="w-28 font-medium text-sm">{day.label}</div>

                  {/* Time slot chips */}
                  <div className="flex-1 flex flex-wrap gap-2 items-center">
                    {ranges.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Nessuna disponibilità</span>
                    ) : (
                      ranges.map((range, idx) => (
                        <Badge 
                          key={range.temp_id || idx} 
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {range.start_time}–{range.end_time}
                        </Badge>
                      ))
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
                          <Copy className="h-4 w-4 mr-2" />
                          Copia ad altri giorni
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteAllSlots(day.key)}
                          disabled={ranges.length === 0}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Elimina tutte le fasce
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Inline editor */}
                {isExpanded && (
                  <div className="border-t bg-muted/30 p-4 space-y-3">
                    {ranges.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        Clicca Salva per rimuovere tutta la disponibilità per questo giorno
                      </div>
                    ) : (
                      ranges.map((range, index) => (
                      <div key={range.temp_id || index} className="flex items-center gap-3">
                        <input
                          type="time"
                          value={range.start_time}
                          onChange={(e) =>
                            updateTimeRange(day.key, index, "start_time", e.target.value)
                          }
                          className="flex h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm"
                          step="300"
                        />
                        <span className="text-muted-foreground">—</span>
                        <input
                          type="time"
                          value={range.end_time}
                          onChange={(e) =>
                            updateTimeRange(day.key, index, "end_time", e.target.value)
                          }
                          className="flex h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm"
                          step="300"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeRange(day.key, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      ))
                    )}
                    {hasChanges && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => saveDay(day.key)}
                          disabled={deleteMutation.isPending || bulkCreateMutation.isPending}
                        >
                          Salva
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newEditMode = { ...editMode };
                            delete newEditMode[day.key];
                            setEditMode(newEditMode);
                            setExpandedDay(null);
                          }}
                        >
                          Annulla
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
