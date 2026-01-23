

# Piano Implementativo: Cancellazione Serie + Avviso Notifiche

## Riepilogo Architetturale

| Decisione | Scelta |
|-----------|--------|
| Scope cancellazione | **Solo eventi futuri** (`start_at >= p_now`) |
| Allineamento timestamp | Client passa `p_now` → usato sia per count che per RPC |
| Actor | `'coach'` (coerente con pattern esistente: `useCancelEvent.ts` riga 39) |
| Transazionalità creazione | Generazione `series_id` client-side + toast feedback dettagliato |
| Query invalidation | Pattern esistente `["events"], exact: false` |

---

## Fase 1: Migrazione SQL - Aggiungere filtro temporale all'RPC

**Azione**: Creare nuova migrazione che modifica `cancel_series_with_ledger` per supportare cancellazione "solo futuri"

**Modifiche all'RPC esistente** (attualmente righe 543-604 in `20260105204532_...sql`):

```sql
CREATE OR REPLACE FUNCTION cancel_series_with_ledger(
  p_series_id uuid,
  p_actor text,
  p_now timestamptz DEFAULT now(),
  p_only_future boolean DEFAULT true  -- NUOVO parametro, default true
) RETURNS jsonb AS $$
DECLARE
  v_event_id uuid;
  v_event_ids uuid[];
  v_results jsonb[] := '{}';
  v_result jsonb;
  v_count int := 0;
  v_errors int := 0;
  v_coach_client_id uuid;
BEGIN
  -- Selezione con filtro temporale condizionale
  SELECT array_agg(id ORDER BY start_at), MIN(coach_client_id) 
  INTO v_event_ids, v_coach_client_id
  FROM events 
  WHERE series_id = p_series_id 
    AND session_status NOT IN ('canceled', 'done')
    AND (NOT p_only_future OR start_at >= p_now)  -- NUOVA condizione
  FOR UPDATE;
  
  -- Resto della funzione invariato...
```

**Nota**: Il campo `session_status` è corretto (CHECK constraint su `events`), confermato da `20251029164906_...sql:114`.

---

## Fase 2: Aggiornare i Tipi TypeScript

**File**: `src/features/events/types.ts`

Aggiungere a `Event` interface (dopo riga 20):
```typescript
series_id?: string | null;
```

Aggiungere a `CreateEventInput` interface (dopo riga 44):
```typescript
series_id?: string;
```

**NON** aggiungere a `UpdateEventInput` → `series_id` è write-once.

---

## Fase 3: Popolare `series_id` durante Creazione Ricorrenze

**File**: `src/features/events/components/EventEditorModal.tsx`

Nella sezione di creazione batch (righe ~524-539):

```typescript
// === RICORRENZE ===
if (recurrence.enabled && occurrences.length > 0) {
  toast.info(`Creazione di ${occurrences.length} appuntamenti ricorrenti...`);

  // NUOVO: Generare series_id unico per la serie
  const seriesId = crypto.randomUUID();
  
  let successCount = 0;
  let failCount = 0;

  const createPromises = occurrences.map(async (occurrenceDate) => {
    const startAt = setMinutes(setHours(startOfDay(occurrenceDate), startH), startM);
    const endAt = setMinutes(setHours(startOfDay(occurrenceDate), endH), endM);

    try {
      const result = await createEvent.mutateAsync({
        ...basePayload,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        series_id: seriesId,  // NUOVO
      });
      successCount++;
      return result;
    } catch (err) {
      failCount++;
      console.error('Failed to create occurrence:', err);
      return null;
    }
  });

  const createdEvents = (await Promise.all(createPromises)).filter(Boolean);

  // Feedback migliorato per fallimenti parziali
  if (failCount > 0 && successCount > 0) {
    toast.warning(`Creati ${successCount} appuntamenti, ${failCount} falliti`);
  } else if (failCount > 0 && successCount === 0) {
    toast.error("Creazione fallita per tutti gli appuntamenti");
    return;
  }
  // ... resto della logica invariato
}
```

---

## Fase 4: Propagare `series_id` nel Callback di Cancellazione

### 4.1 Aggiornare Interface in `EventModal.tsx`

**File**: `src/features/events/components/EventModal.tsx` (riga 20)

```typescript
onDeleteRequest?: (eventId: string, eventTitle: string, seriesId?: string | null) => void;
```

E propagare alla riga 72:
```typescript
onDeleteRequest={(eventId, title, seriesId) => onDeleteRequest?.(eventId, title, seriesId)}
```

### 4.2 Aggiornare `EventEditorModal.tsx`

**File**: `src/features/events/components/EventEditorModal.tsx` (riga 74)

```typescript
onDeleteRequest?: (eventId: string, eventTitle: string, seriesId?: string | null) => void;
```

Modificare le chiamate (righe ~1743 e ~1767):
```typescript
onDeleteRequest(event.id, event.title, event.series_id);
```

---

## Fase 5: Creare Hook `useDeleteSeries`

**File**: `src/features/events/hooks/useDeleteSeries.ts` (nuovo)

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeleteSeriesResult {
  series_id: string;
  canceled_count: number;
  errors_count: number;
  total_events: number;
}

export function useDeleteSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seriesId: string): Promise<DeleteSeriesResult> => {
      // ALLINEAMENTO TIMESTAMP: passa p_now dal client
      const now = new Date().toISOString();
      
      const { data, error } = await supabase.rpc('cancel_series_with_ledger', {
        p_series_id: seriesId,
        p_actor: 'coach',
        p_now: now,
        p_only_future: true,
      });
      
      if (error) throw error;
      return data as DeleteSeriesResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["events"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["packages"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["package-ledger"], exact: false });
      
      if (result.canceled_count > 0) {
        toast.success(`Cancellati ${result.canceled_count} appuntamenti`, {
          description: "Il cliente riceverà una notifica per ogni cancellazione"
        });
      } else {
        toast.info("Nessun appuntamento futuro da cancellare");
      }
    },
    onError: (error: Error) => {
      toast.error("Errore nella cancellazione", { description: error.message });
    },
  });
}
```

---

## Fase 6: Aggiungere Utility `countFutureSeriesEvents`

**File**: `src/features/events/api/events.api.ts`

```typescript
export async function countFutureSeriesEvents(
  seriesId: string, 
  asOfNow?: string  // ALLINEAMENTO: permette di passare lo stesso "now" usato altrove
): Promise<number> {
  const now = asOfNow || new Date().toISOString();
  
  const { count, error } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('series_id', seriesId)
    .not('session_status', 'in', '("canceled","done")')
    .gte('start_at', now);
  
  if (error) throw error;
  return count || 0;
}
```

---

## Fase 7: Espandere la Modale di Conferma in `Calendar.tsx`

### 7.1 Nuovi Import e Stati

**File**: `src/pages/Calendar.tsx` (righe ~1-20)

```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { useDeleteSeries } from "@/features/events/hooks/useDeleteSeries";
import { countFutureSeriesEvents } from "@/features/events/api/events.api";
import { useQuery } from "@tanstack/react-query";
```

### 7.2 Espandere Stati (dopo riga 61)

```typescript
const [deleteConfirmation, setDeleteConfirmation] = useState<{
  eventId: string;
  eventTitle: string;
  seriesId?: string | null;
} | null>(null);

const [deleteScope, setDeleteScope] = useState<'single' | 'series'>('single');

const deleteSeries = useDeleteSeries();

// Query per contare eventi futuri della serie
const { data: futureSeriesCount = 0, isLoading: isLoadingSeriesCount } = useQuery({
  queryKey: ['series-count', deleteConfirmation?.seriesId],
  queryFn: () => countFutureSeriesEvents(deleteConfirmation!.seriesId!),
  enabled: !!deleteConfirmation?.seriesId,
  staleTime: 0, // Sempre fresh quando apriamo la modale
});
```

### 7.3 Aggiornare Handler (righe ~147-156)

```typescript
const handleDeleteRequest = (
  eventId: string, 
  eventTitle: string, 
  seriesId?: string | null
) => {
  setDeleteConfirmation({ eventId, eventTitle, seriesId });
  setDeleteScope('single'); // Reset a default sicuro
};

const handleConfirmDelete = async () => {
  if (!deleteConfirmation) return;
  
  try {
    if (deleteScope === 'series' && deleteConfirmation.seriesId) {
      await deleteSeries.mutateAsync(deleteConfirmation.seriesId);
    } else {
      await deleteEvent.mutateAsync(deleteConfirmation.eventId);
    }
  } finally {
    setDeleteConfirmation(null);
    setDeleteScope('single');
  }
};
```

### 7.4 Aggiornare Props di EventModal (riga ~309)

```typescript
onDeleteRequest={(eventId, eventTitle, seriesId) => 
  handleDeleteRequest(eventId, eventTitle, seriesId)
}
```

### 7.5 Nuova UI dell'AlertDialog (righe ~320-342)

```tsx
<AlertDialog 
  open={!!deleteConfirmation} 
  onOpenChange={(open) => {
    if (!open) {
      setDeleteConfirmation(null);
      setDeleteScope('single');
    }
  }}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Cancellare questo appuntamento?</AlertDialogTitle>
      <AlertDialogDescription asChild>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Stai per eliminare l'evento "{deleteConfirmation?.eventTitle}".
          </p>
          
          {/* Scelta serie/singolo - solo se fa parte di una serie con più eventi futuri */}
          {deleteConfirmation?.seriesId && !isLoadingSeriesCount && futureSeriesCount > 1 && (
            <RadioGroup
              value={deleteScope}
              onValueChange={(v) => setDeleteScope(v as 'single' | 'series')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="single" id="delete-single" />
                <Label htmlFor="delete-single" className="font-normal cursor-pointer">
                  Solo questo evento
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="series" id="delete-series" />
                <Label htmlFor="delete-series" className="font-normal cursor-pointer">
                  Tutti i {futureSeriesCount} appuntamenti futuri della serie
                </Label>
              </div>
            </RadioGroup>
          )}
          
          {/* Loading state per il conteggio */}
          {deleteConfirmation?.seriesId && isLoadingSeriesCount && (
            <p className="text-sm text-muted-foreground italic">
              Verifica appuntamenti della serie...
            </p>
          )}
          
          {/* Avviso notifiche - SEMPRE visibile */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <span className="text-amber-800 dark:text-amber-200">
              Il cliente riceverà una notifica in-app e via email.
            </span>
          </div>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annulla</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleConfirmDelete}
        disabled={deleteEvent.isPending || deleteSeries.isPending || isLoadingSeriesCount}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {(deleteEvent.isPending || deleteSeries.isPending) 
          ? "Eliminazione..." 
          : deleteScope === 'series' 
            ? `Elimina ${futureSeriesCount} eventi`
            : "Elimina"
        }
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Riepilogo File Coinvolti

| File | Tipo Modifica |
|------|---------------|
| Nuova migrazione SQL | Aggiorna RPC con `p_only_future` |
| `src/features/events/types.ts` | Aggiunge `series_id` a `Event` e `CreateEventInput` |
| `src/features/events/components/EventEditorModal.tsx` | Genera `series_id`, propaga nel callback |
| `src/features/events/components/EventModal.tsx` | Propaga `series_id` nel callback |
| `src/pages/Calendar.tsx` | UI scelta serie/singolo + avviso notifiche |
| `src/features/events/hooks/useDeleteSeries.ts` | Nuovo hook per cancellazione serie |
| `src/features/events/api/events.api.ts` | Nuova funzione `countFutureSeriesEvents` |

---

## Gestione Eventi Legacy

Gli eventi ricorrenti creati **prima** di questa implementazione non avranno `series_id` popolato:
- La modale mostrerà solo l'opzione di cancellazione singola
- Non sarà possibile cancellarli come serie retroattivamente

---

## Test Consigliati

1. **Singolo evento**: Cancella evento singolo → solo quello rimosso + notifica inviata
2. **Serie (solo futuri)**: Cancella serie → tutti i futuri rimossi, passati intatti
3. **Legacy**: Evento senza `series_id` → nessuna opzione "serie" mostrata
4. **Ledger**: Verifica crediti rilasciati correttamente per ogni evento cancellato
5. **Timestamp alignment**: Evento al confine di `now()` → comportamento coerente tra UI e backend

