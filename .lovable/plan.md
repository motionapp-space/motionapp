

# Exit Session Dialog + Session Removal — Piano Aggiornato

## Riepilogo Correzioni Applicate

| # | Correzione | Stato |
|---|------------|-------|
| 1 | RPC autorizza coach + client | ✅ Aggiornato |
| 2 | FK column name verificato: `session_id` (corretto) | ✅ Confermato |
| 3 | "Esci senza salvare" = link-style (non h-14) | ✅ Aggiornato |
| 4 | Copy esplicita per discard | ✅ Aggiornato |

---

## Fase 1: Backend — RPC `discard_training_session`

### 1.1 Migrazione SQL

```sql
CREATE OR REPLACE FUNCTION public.discard_training_session(p_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coach_client_id UUID;
  v_client_id UUID;
  v_coach_id UUID;
  v_requesting_user UUID;
  v_is_client BOOLEAN := FALSE;
  v_is_coach BOOLEAN := FALSE;
BEGIN
  v_requesting_user := auth.uid();
  
  IF v_requesting_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get session's coach_client_id
  SELECT coach_client_id INTO v_coach_client_id
  FROM training_sessions
  WHERE id = p_session_id;
  
  IF v_coach_client_id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  
  -- Get client_id and coach_id from coach_clients
  SELECT client_id, coach_id 
  INTO v_client_id, v_coach_id
  FROM coach_clients
  WHERE id = v_coach_client_id;
  
  -- Check if user is the CLIENT owner
  IF EXISTS (
    SELECT 1 FROM clients 
    WHERE id = v_client_id AND user_id = v_requesting_user
  ) THEN
    v_is_client := TRUE;
  END IF;
  
  -- Check if user is the COACH owner
  -- (coaches.id = auth.uid() directly, no user_id column)
  IF v_coach_id = v_requesting_user THEN
    v_is_coach := TRUE;
  END IF;
  
  -- Authorize: must be client OR coach
  IF NOT (v_is_client OR v_is_coach) THEN
    RAISE EXCEPTION 'Not authorized to discard this session';
  END IF;
  
  -- Delete all actuals for this session (FK: session_id)
  DELETE FROM exercise_actuals WHERE session_id = p_session_id;
  
  -- Update session status to discarded
  UPDATE training_sessions
  SET status = 'discarded', ended_at = NOW()
  WHERE id = p_session_id;
END;
$$;
```

**Note tecniche:**
- `coaches.id` = `auth.uid()` (nessuna colonna `user_id` in coaches)
- `clients.user_id` = `auth.uid()` per i clienti
- FK confermato: `exercise_actuals.session_id`

---

## Fase 2: Frontend Adapter + Service + Hook

### 2.1 Aggiornare Interface (`sessionTrackingAdapter.ts`)

Aggiungere metodo all'interfaccia:

```typescript
/**
 * Discard session and delete all associated actuals
 * Atomically: deletes actuals + sets status to 'discarded'
 */
discardSessionWithCleanup(sessionId: string): Promise<void>;
```

### 2.2 Implementare in `clientSessionTrackingAdapter.ts`

```typescript
async discardSessionWithCleanup(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('discard_training_session', {
    p_session_id: sessionId
  });
  if (error) throw error;
}
```

### 2.3 Aggiornare Service (`sessionTrackingService.ts`)

```typescript
/**
 * Discard session with full cleanup (delete actuals + mark discarded)
 */
async discardSessionWithCleanup({ sessionId }: DiscardSessionParams) {
  return adapter.discardSessionWithCleanup(sessionId);
}
```

### 2.4 Nuovo Hook (`useClientSessionTracking.ts`)

```typescript
/**
 * Discard session with cleanup (deletes actuals, marks discarded)
 */
export function useDiscardClientSessionWithCleanup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => 
      service.discardSessionWithCleanup({ sessionId }),
    onSuccess: (_, sessionId) => {
      // Invalidate all related queries to prevent stale data
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.active });
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.actuals(sessionId) });
    },
  });
}
```

---

## Fase 3: Dialog Unificato in `ClientLiveSession.tsx`

### 3.1 State — Unificare i dialog

Rimuovere:
```typescript
const [showFinishDialog, setShowFinishDialog] = useState(false);
const [showExitDialog, setShowExitDialog] = useState(false);
```

Sostituire con:
```typescript
const [showLeaveDialog, setShowLeaveDialog] = useState(false);
```

### 3.2 Nuova Mutation

```typescript
const { mutate: discardWithCleanup, isPending: isDiscarding } = 
  useDiscardClientSessionWithCleanup();
```

### 3.3 Handlers

```typescript
const handleContinue = () => {
  setShowLeaveDialog(false);
};

const handleEndWorkout = () => {
  if (!sessionId) return;
  finishSession(
    { sessionId },
    {
      onSuccess: () => {
        store.clear();
        navigate('/client/app/workouts');
      },
      onError: (error) => toast.error(error.message || 'Errore nel salvataggio'),
    }
  );
};

const handleExitWithoutSaving = () => {
  if (!sessionId) return;
  discardWithCleanup(sessionId, {
    onSuccess: () => {
      store.clear();
      navigate('/client/app/workouts');
    },
    onError: (error) => toast.error(error.message || 'Errore'),
  });
};
```

### 3.4 Trigger Points

Aggiornare tutti i punti che aprono dialog:
- "Termina allenamento" nel bottom bar → `setShowLeaveDialog(true)`
- Back arrow / route-back quando `shouldConfirmExit === true` → `setShowLeaveDialog(true)`

### 3.5 Dialog UI — Gerarchia Corretta

```tsx
<AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
  <AlertDialogContent className="w-[calc(100%-32px)] max-w-[420px] rounded-2xl p-6">
    <AlertDialogHeader>
      <AlertDialogTitle>Uscire dall'allenamento?</AlertDialogTitle>
      <AlertDialogDescription className="mt-2 space-y-2">
        {actuals.length > 0 ? (
          <>
            <p>Se termini l'allenamento, le serie completate verranno salvate.</p>
            <p className="text-destructive/70">
              Esci senza salvare elimina le serie registrate in questa sessione.
            </p>
          </>
        ) : (
          <p>Non hai ancora completato nessuna serie.</p>
        )}
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <div className="flex flex-col mt-6 gap-3">
      {/* PRIMARY: Continue — safe action, filled, h-14 */}
      <Button 
        onClick={handleContinue}
        className="w-full h-14 rounded-[14px] text-base font-medium"
      >
        Continua allenamento
      </Button>
      
      {/* SECONDARY: End workout — save, outline, h-14 */}
      <Button 
        variant="outline"
        onClick={handleEndWorkout}
        disabled={isFinishing}
        className="w-full h-14 rounded-[14px] text-base font-medium"
      >
        {isFinishing ? 'Salvataggio...' : 'Termina allenamento'}
      </Button>
      
      {/* DESTRUCTIVE: Exit without saving — link-style, NOT h-14 */}
      <button
        type="button"
        onClick={handleExitWithoutSaving}
        disabled={isDiscarding}
        className="w-full min-h-[44px] px-3 py-2 text-sm font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors disabled:opacity-50"
      >
        {isDiscarding ? 'Uscita...' : 'Esci senza salvare'}
      </button>
    </div>
  </AlertDialogContent>
</AlertDialog>
```

**Differenze chiave rispetto al piano originale:**
- "Esci senza salvare" è un `<button>` nativo con `text-sm`, non un `<Button h-14>`
- Mantiene `min-h-[44px]` per accessibilità
- Visual weight ridotto rispetto alle altre CTA

---

## Fase 4: Session History — "Rimuovi dalla cronologia" (Client)

### 4.1 Aggiungere in `ClientSessionDetailSheet.tsx`

Import:
```typescript
import { useDiscardClientSession } from '@/features/session-tracking/hooks/useClientSessionTracking';
import { Trash2 } from 'lucide-react';
```

Hook e handler:
```typescript
const { mutate: discardSession, isPending: isRemoving } = useDiscardClientSession();

const handleRemoveFromHistory = () => {
  if (!session) return;
  discardSession(session.id, {
    onSuccess: () => {
      toast.success('Sessione rimossa dalla cronologia');
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message || 'Errore'),
  });
};
```

### 4.2 UI Button (nel footer della sheet)

```tsx
<div className="pt-4 border-t mt-4">
  <button
    type="button"
    onClick={handleRemoveFromHistory}
    disabled={isRemoving}
    className="w-full min-h-[44px] px-3 py-2 text-sm font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
  >
    <Trash2 className="h-4 w-4" />
    {isRemoving ? 'Rimozione...' : 'Rimuovi dalla cronologia'}
  </button>
</div>
```

**Nota:** Questo usa `useDiscardClientSession` esistente (che chiama `updateSession` con `status: 'discarded'`), NON la nuova RPC. Per sessioni vecchie completate non serve eliminare gli actuals.

---

## File da Modificare

| File | Modifica |
|------|----------|
| **Nuova Migrazione SQL** | RPC `discard_training_session` |
| `src/features/session-tracking/adapters/sessionTrackingAdapter.ts` | Aggiungere metodo interface |
| `src/features/session-tracking/adapters/clientSessionTrackingAdapter.ts` | Implementare `discardSessionWithCleanup` |
| `src/features/session-tracking/services/sessionTrackingService.ts` | Aggiungere service method |
| `src/features/session-tracking/hooks/useClientSessionTracking.ts` | Aggiungere `useDiscardClientSessionWithCleanup` |
| `src/pages/client/ClientLiveSession.tsx` | Dialog unificato, handlers, rimuovere vecchi dialog |
| `src/features/client-workouts/components/ClientSessionDetailSheet.tsx` | "Rimuovi dalla cronologia" |

---

## Checklist Testing

- [ ] **Continue** → dialog si chiude, sessione continua
- [ ] **Termina allenamento** → sessione salvata come completed, actuals preservati, redirect
- [ ] **Esci senza salvare** → actuals eliminati, sessione = discarded, redirect
- [ ] **Back button** quando `shouldConfirmExit` → mostra dialog unificato
- [ ] **Storia sessioni** → mostra solo completed (discarded filtrate)
- [ ] **Rimuovi dalla cronologia** → sessione scompare dalla lista
- [ ] **Coach può discardare** via RPC (per future estensioni)

---

## Considerazioni Sicurezza

- RPC usa `SECURITY DEFINER` ma valida ownership prima di ogni mutazione
- Clients **non possono hard-delete** sessioni — solo soft delete via status
- Coach deletion rimane invariato (RLS esistente lo permette)
- **Nessuna nuova policy DELETE** necessaria per `training_sessions`

