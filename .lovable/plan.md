

## Fix: Bottone "Inizia allenamento" non funzionante

### Diagnosi

Analizzando il flusso completo:

1. **`NextWorkoutCTA`** chiama `onStart()` (che e' `handleStartSession`) senza `await` -- se l'operazione asincrona fallisce prima del try/catch interno, il rejection non viene gestito
2. **`useStartClientSession`** non ha un handler `onError` nel mutation hook -- gli errori sono gestiti solo dal try/catch nel componente chiamante, ma questo e' fragile
3. Se `resolveCoachClientId()` o `createSession()` lanciano un errore non previsto (es. problema di rete, utente non autenticato), il rejection puo' sfuggire e causare un crash (schermo bianco)

### Soluzione

Tre interventi difensivi:

**1. `src/features/client-workouts/components/NextWorkoutCTA.tsx`**
- Rendere `handleStartClick` asincrono con try/catch esplicito
- Questo previene rejection non gestiti dal propagarsi

```text
Prima:  const handleStartClick = () => { ... onStart(); }
Dopo:   const handleStartClick = async () => { try { await onStart(); } catch { toast.error(...) } }
```

**2. `src/features/session-tracking/hooks/useClientSessionTracking.ts`**
- Aggiungere `onError` al mutation `useStartClientSession` come rete di sicurezza
- Questo cattura errori anche se il chiamante dimentica il try/catch

**3. `src/pages/client/ClientWorkouts.tsx`**
- Verificare che `handleStartSession` e `handleSelectDay` abbiano try/catch robusti (gia' presenti, ma aggiungere log console per debug)

### Dettaglio tecnico

**File 1: `NextWorkoutCTA.tsx`** -- handler sicuro

```tsx
// Cambiare onStart: () => void  →  onStart: () => void | Promise<void>
// E nel handler:
const handleStartClick = async () => {
  if (startDisabled) {
    toast.info(startDisabledReason);
    return;
  }
  try {
    await onStart();
  } catch (error) {
    console.error("Failed to start workout:", error);
    toast.error("Impossibile avviare l'allenamento. Riprova.");
  }
};
```

**File 2: `useClientSessionTracking.ts`** -- onError nel mutation

```tsx
export function useStartClientSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: StartSessionParams) => service.startClientSession(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_KEYS.active });
    },
    onError: (error) => {
      console.error("[useStartClientSession] Error:", error);
    },
  });
}
```

**File 3: `WorkoutDayDetailSheet.tsx`** -- handler sicuro per "Registra sessione"

```tsx
// Il bottone onClick={onStartSession} dovrebbe essere wrappato:
const handleStart = async () => {
  try {
    await onStartSession?.();
  } catch (error) {
    console.error("Failed to start session from detail:", error);
    toast.error("Impossibile avviare la sessione. Riprova.");
  }
};
```

### File coinvolti

| File | Azione |
|---|---|
| `src/features/client-workouts/components/NextWorkoutCTA.tsx` | Wrap handler in async try/catch |
| `src/features/session-tracking/hooks/useClientSessionTracking.ts` | Aggiungere onError al mutation |
| `src/features/client-workouts/components/WorkoutDayDetailSheet.tsx` | Wrap handler in async try/catch |
| `src/pages/client/ClientWorkouts.tsx` | Aggiungere console.error nei catch esistenti |

