

# Implementazione Completa `CounterProposeDialog` — Dual Path UX

Allineamento del componente alle specifiche con **Fast Path** (slot suggeriti) + **Power Path** (Calendar + TimePicker + Live Validation).

---

## Riepilogo Architettura Target

```text
┌─────────────────────────────────────────────────────────────────────┐
│                      CounterProposeDialog                           │
├─────────────────────────────────────────────────────────────────────┤
│  Header: "Proponi nuovo orario" + Badge richiesta originale         │
├─────────────────────────────────────────────────────────────────────┤
│  FAST PATH: 4 slot suggeriti (findNearestSlots)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │lun 3 feb │ │mar 4 feb │ │mer 5 feb │ │gio 6 feb │               │
│  │10:00-11:00│ │11:00-12:00│ │14:00-15:00│ │09:00-10:00│               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│  POWER PATH: Selezione manuale                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  [Calendar]              [TimePicker 15min]                     ││
│  │                                                                  ││
│  │  [Live Validation Status]                                        ││
│  │  ✅ Slot disponibile / ❌ Conflitto + 3 alternative              ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Footer: [Proponi · lun 3 feb · 10:00-11:00] (activeProposal)      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Modifiche da Implementare

### 1. Nuovo State Management

**Aggiungere stati per Dual Path + Validation:**

```typescript
// SELECTION MODE (mutua esclusività)
const [selectionMode, setSelectionMode] = useState<'suggested' | 'manual' | null>(null);

// FAST PATH
const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

// POWER PATH
const [manualDate, setManualDate] = useState<Date | undefined>(undefined);
const [manualTime, setManualTime] = useState<string>(""); // "HH:mm"

// LIVE VALIDATION
const [availabilityStatus, setAvailabilityStatus] = useState<
  'idle' | 'loading' | 'available' | 'conflict'
>('idle');
const [conflictEvent, setConflictEvent] = useState<{
  title: string;
  start: string;
  end: string;
} | null>(null);
const [alternativeSlots, setAlternativeSlots] = useState<AvailableSlot[]>([]);
```

### 2. Logica Mutua Esclusività

**Quando l'utente seleziona uno slot suggerito:**
```typescript
const handleSuggestedSlotClick = (slot: AvailableSlot) => {
  setSelectionMode('suggested');
  setSelectedSlot(slot);
  // Reset power path
  setManualDate(undefined);
  setManualTime("");
  setAvailabilityStatus('idle');
};
```

**Quando l'utente modifica data/ora manuale:**
```typescript
const handleManualDateChange = (date: Date | undefined) => {
  setSelectionMode('manual');
  setManualDate(date);
  // Reset fast path
  setSelectedSlot(null);
};

const handleManualTimeChange = (time: string) => {
  setSelectionMode('manual');
  setManualTime(time);
  // Reset fast path
  setSelectedSlot(null);
};
```

### 3. TimePicker con Intervalli 15 Minuti

**Creare variante o prop per 15min:**

```typescript
// Opzione A: Prop interval
interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  interval?: 5 | 15; // default 5
  startHour?: number; // default 6
  endHour?: number;   // default 22
}

// Generazione dinamica
const generateTimeOptions = (interval: number, startHour: number, endHour: number) => {
  const times: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      times.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }
  return times;
};
```

**Auto-scroll all'apertura:**
```typescript
const scrollRef = React.useRef<HTMLDivElement>(null);

React.useEffect(() => {
  if (open && scrollRef.current && displayValue) {
    const selectedIndex = TIME_OPTIONS.indexOf(displayValue);
    const scrollPosition = Math.max(0, selectedIndex * 40 - 120); // Center
    scrollRef.current.scrollTop = scrollPosition;
  }
}, [open, displayValue]);
```

### 4. Live Validation con Debounce

**Import e setup:**
```typescript
import { useDebounce } from "@/hooks/use-debounce";

const debouncedManualDate = useDebounce(manualDate, 300);
const debouncedManualTime = useDebounce(manualTime, 300);
```

**Effect di validazione:**
```typescript
useEffect(() => {
  // Skip se non siamo in manual mode o dati incompleti
  if (selectionMode !== 'manual' || !debouncedManualDate || !debouncedManualTime) {
    setAvailabilityStatus('idle');
    setConflictEvent(null);
    setAlternativeSlots([]);
    return;
  }

  setAvailabilityStatus('loading');

  // Parse time
  const [hours, minutes] = debouncedManualTime.split(':').map(Number);
  const proposedStart = setMinutes(setHours(debouncedManualDate, hours), minutes);
  const proposedEnd = addMinutes(proposedStart, slotDuration);

  // Cerca conflitti (ignora eventi cancellati)
  const conflicting = events.find(event => {
    if (event.session_status === 'canceled') return false;
    const eventStart = parseISO(event.start_at);
    const eventEnd = parseISO(event.end_at);
    return proposedStart < eventEnd && proposedEnd > eventStart;
  });

  if (conflicting) {
    setAvailabilityStatus('conflict');
    setConflictEvent({
      title: conflicting.title || 'Evento',
      start: conflicting.start_at,
      end: conflicting.end_at,
    });
    // Trova 3 alternative più vicine
    setAlternativeSlots(findNearestSlots(proposedStart, allSlotsFor14Days).slice(0, 3));
  } else {
    setAvailabilityStatus('available');
    setConflictEvent(null);
    setAlternativeSlots([]);
  }
}, [debouncedManualDate, debouncedManualTime, selectionMode, events, slotDuration, allSlotsFor14Days]);
```

### 5. `activeProposal` useMemo

**Unifica entrambi i path per il CTA:**
```typescript
const activeProposal = useMemo((): AvailableSlot | null => {
  // FAST PATH
  if (selectionMode === 'suggested' && selectedSlot) {
    return selectedSlot;
  }

  // POWER PATH (solo se disponibile)
  if (selectionMode === 'manual' && manualDate && manualTime && 
      availabilityStatus === 'available') {
    const [hours, minutes] = manualTime.split(':').map(Number);
    const start = setMinutes(setHours(manualDate, hours), minutes);
    const end = addMinutes(start, slotDuration);
    return { 
      start: start.toISOString(), 
      end: end.toISOString() 
    };
  }

  return null;
}, [selectionMode, selectedSlot, manualDate, manualTime, availabilityStatus, slotDuration]);
```

### 6. Aggiornamento `handleSubmit`

```typescript
const handleSubmit = () => {
  if (!activeProposal || !request) return;
  onSubmit(request.id, activeProposal.start, activeProposal.end);
};
```

### 7. Nuovo UI Power Path

**Sostituire la sezione Time Slots con:**

```tsx
{/* POWER PATH: Selezione Manuale */}
<div className="px-4 py-3 border-t">
  <div className="flex items-center gap-2 text-sm font-medium mb-3">
    <Calendar className="h-4 w-4 text-muted-foreground" />
    Oppure scegli manualmente
  </div>
  
  <div className="grid grid-cols-2 gap-3">
    {/* Calendar Picker */}
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Calendar className="mr-2 h-4 w-4" />
          {manualDate ? format(manualDate, "d MMM", { locale: it }) : "Data"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          selected={manualDate}
          onSelect={handleManualDateChange}
          disabled={(date) => 
            date < startOfDay(new Date()) || 
            date > rangeEnd
          }
          locale={it}
        />
      </PopoverContent>
    </Popover>
    
    {/* Time Picker 15min */}
    <TimePicker
      value={manualTime}
      onChange={handleManualTimeChange}
      interval={15}
      startHour={6}
      endHour={22}
      placeholder="Orario"
    />
  </div>
  
  {/* Live Validation Status */}
  {selectionMode === 'manual' && (
    <div className="mt-3">
      {availabilityStatus === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifica disponibilità...
        </div>
      )}
      
      {availabilityStatus === 'available' && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="h-4 w-4" />
          Slot disponibile
        </div>
      )}
      
      {availabilityStatus === 'conflict' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <X className="h-4 w-4" />
            Conflitto: {conflictEvent?.title}
          </div>
          
          {alternativeSlots.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Orari alternativi:</p>
              <div className="flex flex-wrap gap-1">
                {alternativeSlots.map((slot, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSuggestedSlotClick(slot)}
                  >
                    {formatSlotDate(slot)} · {formatSlotTime(slot)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )}
</div>
```

### 8. Footer Aggiornato

```tsx
<div className="border-t bg-background p-4">
  {activeProposal ? (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-green-600" />
        Proposta pronta per l'invio
      </div>
      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting}
        className="w-full"
        size="lg"
      >
        Proponi · {formatSlotDate(activeProposal)} · {formatSlotTime(activeProposal)}
      </Button>
    </div>
  ) : (
    <Button disabled className="w-full" size="lg">
      Seleziona un orario
    </Button>
  )}
</div>
```

---

## File da Modificare

| File | Modifica |
|------|----------|
| `src/components/ui/time-picker.tsx` | Aggiungere prop `interval`, `startHour`, `endHour` + auto-scroll |
| `src/features/bookings/components/CounterProposeDialog.tsx` | Ristrutturazione completa con Dual Path UX |

---

## Import Aggiuntivi per CounterProposeDialog

```typescript
import { useDebounce } from "@/hooks/use-debounce";
import { TimePicker } from "@/components/ui/time-picker";
import { Loader2, X } from "lucide-react";
import { setHours, setMinutes, addMinutes } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
```

---

## Riepilogo Flusso UX

```text
1. Dialog aperto
   ├─▶ Fast Path: 4 slot suggeriti visibili
   │   └─▶ Click slot → selectionMode='suggested' → activeProposal set
   │
   └─▶ Power Path: Calendar + TimePicker
       ├─▶ Seleziona data → selectionMode='manual'
       ├─▶ Seleziona ora → debounce 300ms
       └─▶ useEffect validation
           ├─▶ 'available' → activeProposal set
           └─▶ 'conflict' → mostra evento + 3 alternative
               └─▶ Click alternativa → torna a Fast Path

2. Footer
   └─▶ activeProposal !== null → Bottone attivo "Proponi · ..."
       └─▶ Click → handleSubmit → onSubmit(id, start, end)
```

