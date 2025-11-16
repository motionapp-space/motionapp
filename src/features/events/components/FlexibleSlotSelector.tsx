import { useState } from "react";
import { Clock, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { format, parse, setHours, setMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { AvailableSlot } from "@/features/bookings/types";
import type { OccupiedSlot } from "../hooks/useOccupiedSlots";

interface FlexibleSlotSelectorProps {
  date: Date;
  availableSlots: AvailableSlot[];
  occupiedSlots: OccupiedSlot[];
  selectedSlot?: AvailableSlot;
  durationMinutes: number;
  onSlotSelect: (slot: AvailableSlot) => void;
  onCustomTimeSelect: (start: Date, end: Date) => void;
}

// Generate time options in 15-minute intervals
const generateTimeOptions = (): string[] => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

export function FlexibleSlotSelector({
  date,
  availableSlots,
  occupiedSlots,
  selectedSlot,
  durationMinutes,
  onSlotSelect,
  onCustomTimeSelect,
}: FlexibleSlotSelectorProps) {
  const [customTime, setCustomTime] = useState<string>("");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleCustomTimeConfirm = () => {
    if (!customTime) return;
    
    try {
      const [hours, minutes] = customTime.split(":").map(Number);
      const start = setMinutes(setHours(date, hours), minutes);
      const end = new Date(start.getTime() + durationMinutes * 60000);
      
      onCustomTimeSelect(start, end);
      setShowTimePicker(false);
    } catch (error) {
      console.error("Invalid time format", error);
    }
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), "HH:mm");
  };

  // Get occupied slots for today
  const todayOccupied = occupiedSlots.filter((slot) => {
    const slotDate = new Date(slot.start);
    return (
      slotDate.getDate() === date.getDate() &&
      slotDate.getMonth() === date.getMonth() &&
      slotDate.getFullYear() === date.getFullYear()
    );
  });

  return (
    <div className="space-y-6">
      {/* Date display */}
      <div className="text-center py-2 border-b">
        <p className="text-sm text-muted-foreground">
          {format(date, "EEEE d MMMM yyyy")}
        </p>
      </div>

      {/* Available slots suggestions */}
      {availableSlots.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <h4 className="text-sm font-medium">Slot disponibili suggeriti</h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.slice(0, 9).map((slot) => (
              <Button
                key={slot.start}
                variant={selectedSlot?.start === slot.start ? "default" : "outline"}
                size="sm"
                onClick={() => onSlotSelect(slot)}
                className={cn(
                  "h-auto py-2 px-3 flex flex-col items-start",
                  selectedSlot?.start === slot.start && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <span className="font-mono text-xs">{formatTime(slot.start)}</span>
                <span className="text-[10px] text-muted-foreground">
                  {durationMinutes} min
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Custom time picker */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Oppure scegli un orario personalizzato</h4>
        </div>
        <div className="flex gap-2">
          <Popover open={showTimePicker} onOpenChange={setShowTimePicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-start text-left font-normal"
              >
                <Clock className="mr-2 h-4 w-4" />
                {customTime || "Seleziona orario"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <ScrollArea className="h-[280px]">
                <div className="p-2">
                  {TIME_OPTIONS.map((time) => (
                    <Button
                      key={time}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start font-mono text-sm",
                        time === customTime && "bg-accent"
                      )}
                      onClick={() => setCustomTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Button
            onClick={handleCustomTimeConfirm}
            disabled={!customTime}
            size="default"
          >
            Conferma
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Puoi selezionare qualsiasi orario, anche fuori dalla tua disponibilità abituale
        </p>
      </div>

      {/* Occupied slots */}
      {todayOccupied.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <h4 className="text-sm font-medium">Slot già occupati</h4>
          </div>
          <div className="space-y-2">
            {todayOccupied.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm">
                    {formatTime(slot.start)} - {formatTime(slot.end)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {slot.clientName}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {slot.title}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Puoi comunque creare un appuntamento in questi orari se necessario. 
              Riceverai un avviso se c'è sovrapposizione con altri eventi.
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {availableSlots.length === 0 && todayOccupied.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Nessun appuntamento per questo giorno</p>
          <p className="text-xs mt-1">Usa il selettore orario per crearne uno</p>
        </div>
      )}
    </div>
  );
}
