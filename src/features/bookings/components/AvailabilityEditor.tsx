import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Copy, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAvailabilityWindowsQuery } from "../hooks/useAvailability";

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

// Helper to generate time options (every 15 minutes)
const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      options.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return options;
};

// Helper to sort time ranges by start time
const sortTimeRanges = (ranges: TimeRange[]): TimeRange[] => {
  return [...ranges].sort((a, b) => {
    const [aH, aM] = a.start_time.split(':').map(Number);
    const [bH, bM] = b.start_time.split(':').map(Number);
    return (aH * 60 + aM) - (bH * 60 + bM);
  });
};

export function AvailabilityEditor({
  onChangeDetected, 
  onResetRequested,
  localChangesRef 
}: AvailabilityEditorProps) {
  const { data: windows = [], isLoading } = useAvailabilityWindowsQuery();

  const [editMode, setEditMode] = useState<Record<number, TimeRange[]>>({});
  const [editingSlot, setEditingSlot] = useState<{
    dayOfWeek: number;
    index: number;
    start_time: string;
    end_time: string;
  } | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

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

  const addTimeRangeAndEdit = (dayOfWeek: number) => {
    const currentRanges = getWindowsForDay(dayOfWeek);
    const newIndex = currentRanges.length;
    const newRange = { start_time: "09:00", end_time: "17:00", temp_id: `new-${Date.now()}` };
    
    setEditMode({
      ...editMode,
      [dayOfWeek]: [...currentRanges, newRange],
    });
    
    // Open immediately in edit mode
    setEditingSlot({
      dayOfWeek,
      index: newIndex,
      start_time: "09:00",
      end_time: "17:00",
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
    // Close editing if we're removing the slot being edited
    if (editingSlot?.dayOfWeek === dayOfWeek && editingSlot?.index === index) {
      setEditingSlot(null);
    }
    onChangeDetected?.();
  };

  const startEditing = (dayOfWeek: number, index: number, range: TimeRange) => {
    setEditingSlot({
      dayOfWeek,
      index,
      start_time: formatTimeDisplay(range.start_time), // HH:mm:ss → HH:mm
      end_time: formatTimeDisplay(range.end_time),
    });
  };

  const closeEditor = () => {
    if (!editingSlot) return;
    
    const currentRanges = getWindowsForDay(editingSlot.dayOfWeek);
    
    // If the edited range is valid, save changes
    if (isValidTimeRange(editingSlot.start_time, editingSlot.end_time)) {
      const updated = [...currentRanges];
      updated[editingSlot.index] = {
        ...updated[editingSlot.index],
        start_time: editingSlot.start_time,
        end_time: editingSlot.end_time,
      };
      setEditMode({ ...editMode, [editingSlot.dayOfWeek]: sortTimeRanges(updated) });
      onChangeDetected?.();
    }
    // If invalid, discard changes (keeps original values)
    
    setEditingSlot(null);
  };

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    if (!editingSlot) return;

    const newSlot = { ...editingSlot, [field]: value };
    setEditingSlot(newSlot);

    // Update local state immediately without auto-closing
    const currentRanges = getWindowsForDay(newSlot.dayOfWeek);
    const updated = [...currentRanges];
    updated[newSlot.index] = {
      ...updated[newSlot.index],
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
    };
    setEditMode({ ...editMode, [newSlot.dayOfWeek]: updated }); // No sort during edit
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

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!editingSlot) return;
      if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
        closeEditor();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingSlot, editMode]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Caricamento disponibilità...</div>;
  }

  const timeOptions = generateTimeOptions();

  return (
    <div className="space-y-2">
      {/* Compact table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="divide-y">
          {DAYS_OF_WEEK.map((day) => {
            const ranges = getWindowsForDay(day.key);

            return (
              <div key={day.key} className="bg-card">
                {/* Day row */}
                <div className="flex items-center gap-3 p-3">
                  {/* Day name */}
                  <div className="w-24 font-medium text-sm">{day.label}</div>

                  {/* Pills / Editor inline */}
                  <div className="flex-1 flex flex-wrap gap-2 items-center">
                    {ranges.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Nessuna disponibilità</span>
                    ) : (
                      ranges.map((range, index) => {
                        const isEditing = editingSlot?.dayOfWeek === day.key && editingSlot?.index === index;
                        const isInvalid = !isValidTimeRange(range.start_time, range.end_time);

                        if (isEditing) {
                          // Inline Editor with click-outside handler
                          const isEditInvalid = !isValidTimeRange(editingSlot.start_time, editingSlot.end_time);
                          
                          return (
                            <div 
                              key={range.temp_id || index}
                              ref={editorRef}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card shadow-md border-2 ${
                                isEditInvalid ? 'border-destructive' : 'border-primary'
                              }`}
                            >
                              <span className="text-xs text-muted-foreground">Da:</span>
                              <select 
                                value={editingSlot.start_time}
                                onChange={(e) => handleTimeChange('start_time', e.target.value)}
                                className="bg-transparent border-none text-sm font-medium focus:outline-none focus:ring-0"
                              >
                                {timeOptions.map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                              <span className="text-xs text-muted-foreground">A:</span>
                              <select 
                                value={editingSlot.end_time}
                                onChange={(e) => handleTimeChange('end_time', e.target.value)}
                                className="bg-transparent border-none text-sm font-medium focus:outline-none focus:ring-0"
                              >
                                {timeOptions.map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                              {isEditInvalid && (
                                <span className="text-xs text-destructive whitespace-nowrap">⚠ Invalido</span>
                              )}
                            </div>
                          );
                        }

                        // Pill View - styling migliorato per maggiore affordance
                        return (
                          <button
                            key={range.temp_id || index}
                            onClick={() => startEditing(day.key, index, range)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                              isInvalid 
                                ? 'bg-card border border-destructive hover:shadow hover:border-destructive/50' 
                                : 'bg-card border border-border shadow-sm hover:shadow hover:border-primary/30'
                            }`}
                          >
                            {formatTimeDisplay(range.start_time)} – {formatTimeDisplay(range.end_time)}
                            <X 
                              className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                removeTimeRange(day.key, index); 
                              }}
                            />
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Actions: + Aggiungi fascia + Menu ⋮ */}
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => addTimeRangeAndEdit(day.key)}
                      className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Aggiungi fascia
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
  );
}
