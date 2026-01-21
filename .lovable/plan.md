

# Fix: Separare `expire` vs `discard` per Session Cleanup

## Problema Critico

Il sistema attualmente ha solo `discard_training_session` che **cancella tutti gli actuals**. Se usato per cleanup automatico di sessioni zombie, eliminerebbe dati validi (serie registrate dal cliente).

---

## Soluzione: Due RPC Distinti

| RPC | Comportamento | Quando Usarlo |
|-----|---------------|---------------|
| `expire_training_session` | Solo UPDATE: status → 'discarded', ended_at → now() | Auto-cleanup zombie, client cleanup hook |
| `discard_training_session` | DELETE actuals + UPDATE session | Solo "Esci senza salvare" esplicito |

---

## Fase 1: Database Migration

### 1.1 Creare `expire_training_session` RPC

```sql
CREATE OR REPLACE FUNCTION public.expire_training_session(p_session_id UUID)
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
  
  SELECT coach_client_id INTO v_coach_client_id
  FROM training_sessions
  WHERE id = p_session_id;
  
  IF v_coach_client_id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  
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
  IF v_coach_id = v_requesting_user THEN
    v_is_coach := TRUE;
  END IF;
  
  IF NOT (v_is_client OR v_is_coach) THEN
    RAISE EXCEPTION 'Not authorized to expire this session';
  END IF;
  
  -- SOLO UPDATE, NESSUN DELETE degli actuals!
  UPDATE training_sessions
  SET status = 'discarded', ended_at = NOW()
  WHERE id = p_session_id
    AND status = 'in_progress';  -- Solo sessioni ancora in_progress
END;
$$;
```

### 1.2 Cleanup sessioni zombie esistenti (nella stessa migration)

```sql
-- Marca sessioni zombie (>12h in_progress) come discarded
-- NON cancella actuals
UPDATE training_sessions 
SET status = 'discarded', 
    ended_at = COALESCE(ended_at, NOW())
WHERE status = 'in_progress' 
  AND started_at < NOW() - INTERVAL '12 hours';
```

---

## Fase 2: Adapter Layer

### 2.1 Aggiungere metodo `expireSession` all'interfaccia

**File:** `src/features/session-tracking/adapters/sessionTrackingAdapter.ts`

```typescript
export interface SessionTrackingAdapter {
  // ... esistenti ...
  
  /**
   * Expire session (soft close) - preserves actuals
   * Use for zombie cleanup, NOT for explicit discard
   */
  expireSession(sessionId: string): Promise<void>;
}
```

### 2.2 Implementare in `clientSessionTrackingAdapter.ts`

```typescript
async expireSession(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('expire_training_session', {
    p_session_id: sessionId
  });
  if (error) throw error;
},
```

---

## Fase 3: Service Layer

**File:** `src/features/session-tracking/services/sessionTrackingService.ts`

Aggiungere metodo:

```typescript
/**
 * Expire session (soft close) - preserves actuals data
 * Use for automatic cleanup of zombie sessions
 */
async expireSession({ sessionId }: DiscardSessionParams) {
  return adapter.expireSession(sessionId);
},
```

---

## Fase 4: Hooks Layer

**File:** `src/features/session-tracking/hooks/useClientSessionTracking.ts`

Aggiungere hook:

```typescript
/**
 * Expire session (soft close) - preserves actuals
 * Use for zombie cleanup, NOT for "Exit without saving"
 */
export function useExpireClientSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      service.expireSession({ sessionId }),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.active });
    },
  });
}
```

---

## Fase 5: Client Cleanup Hook

**Nuovo file:** `src/features/session-tracking/hooks/useClientSessionCleanup.ts`

```typescript
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { CLIENT_SESSION_KEYS } from './useClientSessionTracking';

/**
 * Cleanup zombie sessions (>12h) on app load
 * Uses expire (NOT discard) to preserve actuals
 */
export function useClientSessionCleanup() {
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function cleanup() {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      
      // Find own zombie sessions
      const { data: zombies } = await supabase
        .from('training_sessions')
        .select('id')
        .eq('status', 'in_progress')
        .lt('started_at', twelveHoursAgo);

      if (!zombies || zombies.length === 0) return;

      // Expire each (preserve actuals)
      for (const session of zombies) {
        await supabase.rpc('expire_training_session', {
          p_session_id: session.id
        });
      }

      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.all });
    }

    cleanup().catch(console.error);
  }, [queryClient]);
}
```

---

## Fase 6: Integrare Cleanup in ClientWorkouts

**File:** `src/pages/client/ClientWorkouts.tsx`

```typescript
import { useClientSessionCleanup } from '@/features/session-tracking/hooks/useClientSessionCleanup';

function ClientWorkoutsContent() {
  // Cleanup zombie sessions on mount
  useClientSessionCleanup();
  
  // ... resto del componente
}
```

---

## Fase 7: API Coach - Filtrare Sessioni Scartate

**File:** `src/features/sessions/api/sessions.api.ts`

Aggiornare il filtro in `listSessions()`:

```typescript
const filteredData = (data || []).filter((session: any) => {
  // Nascondi sessioni autonome ancora in corso
  const isAutonomousInProgress = 
    session.source === 'autonomous' && session.status === 'in_progress';
  
  // Nascondi sessioni scartate
  const isDiscarded = session.status === 'discarded';
  
  return !isAutonomousInProgress && !isDiscarded;
});
```

---

## Fase 8: UI Cleanup

**File:** `src/features/sessions/components/SessionHistoryTab.tsx`

1. **Rimuovere badge "Solo lettura"** (righe 263-267)
2. **Migliorare "Durata anomala"** → mostrare badge "Sessione incompleta" per durate > 8h

---

## Riepilogo Chiamate

| Scenario | RPC da Chiamare | Cancella Actuals? |
|----------|-----------------|-------------------|
| "Esci senza salvare" in dialog | `discard_training_session` | ✅ Sì |
| Cleanup zombie client-side | `expire_training_session` | ❌ No |
| Cleanup zombie server-side (migration) | UPDATE diretto | ❌ No |
| "Rimuovi dalla cronologia" (history) | UPDATE status via adapter | ❌ No |

---

## File da Modificare

| File | Azione |
|------|--------|
| **Nuova migration SQL** | Creare `expire_training_session` + cleanup zombie |
| `sessionTrackingAdapter.ts` | Aggiungere interfaccia `expireSession` |
| `clientSessionTrackingAdapter.ts` | Implementare `expireSession` |
| `sessionTrackingService.ts` | Aggiungere metodo `expireSession` |
| `useClientSessionTracking.ts` | Aggiungere hook `useExpireClientSession` |
| **Nuovo: `useClientSessionCleanup.ts`** | Hook cleanup zombie |
| `ClientWorkouts.tsx` | Chiamare `useClientSessionCleanup` |
| `sessions.api.ts` | Filtrare anche `discarded` |
| `SessionHistoryTab.tsx` | Rimuovere "Solo lettura", fix "Durata anomala" |

---

## Checklist Testing

- [ ] "Esci senza salvare" → cancella actuals + marca discarded
- [ ] Sessioni zombie (>12h) vengono expired automaticamente (actuals preservati)
- [ ] Coach non vede sessioni `in_progress` autonome
- [ ] Coach non vede sessioni `discarded`
- [ ] Badge "Solo lettura" rimosso
- [ ] "Sessione incompleta" mostrato invece di "Durata anomala"
- [ ] Actuals delle sessioni zombie sono ancora presenti nel DB dopo expire

