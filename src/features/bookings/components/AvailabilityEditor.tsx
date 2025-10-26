import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Copy } from "lucide-react";
import {
  useAvailabilityWindowsQuery,
  useCreateAvailabilityWindow,
  useDeleteAvailabilityWindow,
  useBulkCreateAvailabilityWindows,
} from "../hooks/useAvailability";
import type { CreateAvailabilityWindowInput } from "../types";

const DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

interface TimeRange {
  start_time: string;
  end_time: string;
  temp_id?: string;
}

export function AvailabilityEditor() {
  const { data: windows = [], isLoading } = useAvailabilityWindowsQuery();
  const createMutation = useCreateAvailabilityWindow();
  const deleteMutation = useDeleteAvailabilityWindow();
  const bulkCreateMutation = useBulkCreateAvailabilityWindows();

  const [editMode, setEditMode] = useState<Record<number, TimeRange[]>>({});

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
  };

  const removeTimeRange = (dayOfWeek: number, index: number) => {
    const currentRanges = getWindowsForDay(dayOfWeek);
    const rangeToRemove = currentRanges[index];
    
    if (rangeToRemove.temp_id?.startsWith("new-")) {
      // Just remove from edit mode
      setEditMode({
        ...editMode,
        [dayOfWeek]: currentRanges.filter((_, i) => i !== index),
      });
    } else {
      // Delete from DB
      deleteMutation.mutate(rangeToRemove.temp_id!);
    }
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
  };

  const saveDay = async (dayOfWeek: number) => {
    const ranges = editMode[dayOfWeek] || getWindowsForDay(dayOfWeek);
    
    // Delete all existing windows for this day
    const existingIds = windows
      .filter((w) => w.day_of_week === dayOfWeek)
      .map((w) => w.id);
    
    for (const id of existingIds) {
      await deleteMutation.mutateAsync(id);
    }
    
    // Create new windows
    const inputs: CreateAvailabilityWindowInput[] = ranges.map((r) => ({
      day_of_week: dayOfWeek,
      start_time: r.start_time,
      end_time: r.end_time,
    }));
    
    await bulkCreateMutation.mutateAsync(inputs);
    
    // Clear edit mode
    const newEditMode = { ...editMode };
    delete newEditMode[dayOfWeek];
    setEditMode(newEditMode);
  };

  const copyToOtherDays = (sourceDayOfWeek: number) => {
    const sourceRanges = getWindowsForDay(sourceDayOfWeek);
    const newEditMode = { ...editMode };
    
    for (let day = 0; day < 7; day++) {
      if (day !== sourceDayOfWeek) {
        newEditMode[day] = sourceRanges.map((r) => ({
          start_time: r.start_time,
          end_time: r.end_time,
          temp_id: `new-${Date.now()}-${day}`,
        }));
      }
    }
    
    setEditMode(newEditMode);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Caricamento disponibilità...</div>;
  }

  return (
    <div className="space-y-4">
      {DAYS.map((dayName, dayOfWeek) => {
        const ranges = getWindowsForDay(dayOfWeek);
        const hasChanges = !!editMode[dayOfWeek];

        return (
          <Card key={dayOfWeek}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">{dayName}</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToOtherDays(dayOfWeek)}
                    disabled={ranges.length === 0}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copia ad altri giorni
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTimeRange(dayOfWeek)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi fascia
                  </Button>
                </div>
              </div>

              {ranges.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna disponibilità impostata</p>
              ) : (
                <div className="space-y-3">
                  {ranges.map((range, index) => (
                    <div key={range.temp_id || index} className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="time"
                          value={range.start_time}
                          onChange={(e) =>
                            updateTimeRange(dayOfWeek, index, "start_time", e.target.value)
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                          step="300"
                        />
                        <span className="text-muted-foreground">-</span>
                        <input
                          type="time"
                          value={range.end_time}
                          onChange={(e) =>
                            updateTimeRange(dayOfWeek, index, "end_time", e.target.value)
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                          step="300"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeRange(dayOfWeek, index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {hasChanges && (
                <Button
                  onClick={() => saveDay(dayOfWeek)}
                  className="mt-4 w-full"
                  disabled={deleteMutation.isPending || bulkCreateMutation.isPending}
                >
                  {deleteMutation.isPending || bulkCreateMutation.isPending
                    ? "Salvataggio..."
                    : "Salva modifiche"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
