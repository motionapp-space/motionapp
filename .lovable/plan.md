

## Fix: Cancellazione coach dall'agenda non ripristina crediti e non genera notifica in-app

### Causa radice

La pagina **Calendar.tsx** usa l'hook `useDeleteEvent`, che esegue un `DELETE FROM events` diretto. Questo bypassa completamente:

1. **La RPC `cancel_event_with_ledger`** che gestisce il ripristino crediti nel pacchetto (HOLD_RELEASE nel ledger + aggiornamento contatori)
2. **Il trigger `notify_client_event_canceled`** che genera la notifica in-app al cliente -- il trigger si attiva su `UPDATE session_status = 'canceled' + canceled_by = 'coach'`, ma il DELETE rimuove la riga senza mai fare l'UPDATE

L'email invece arriva perche' `useDeleteEvent` la accoda manualmente tramite `queueBookingEmailWithSnapshot`.

### Soluzione

Riscrivere `useDeleteEvent` per usare la RPC `cancel_event_with_ledger` con `p_actor: 'coach'` invece del DELETE diretto. L'evento verra' marcato come `session_status = 'canceled'` + `canceled_by = 'coach'` (soft-delete) anziche' eliminato fisicamente.

Questo risolve entrambi i bug in un colpo solo:
- La RPC gestisce il ledger e i contatori del pacchetto (credito restituito)
- L'UPDATE su `session_status` fa scattare il trigger che crea la notifica in-app per il cliente

### Dettagli tecnici

**File modificato: `src/features/events/hooks/useDeleteEvent.ts`**

Riscrittura della `mutationFn`:
- Costruire lo snapshot email PRIMA (invariato)
- Chiamare `supabase.rpc('cancel_event_with_ledger', { p_event_id, p_actor: 'coach' })` invece di `deleteEvent(id)`
- Parsare il risultato JSON per mostrare toast appropriati (gia' cancelato, credito rilasciato, ecc.)

Riscrittura della `onSuccess`:
- Invalidare anche `["packages"]` e `["package-ledger"]` (attualmente mancanti)
- Mantenere il log activity e l'accodamento email con snapshot

**File modificato: `src/test/no-dangerous-cancel-paths.test.ts`**

Aggiungere un test anti-regressione:
- `Calendar.tsx` non deve importare `deleteEvent` da `events.api` (il DELETE diretto)
- Verificare che `useDeleteEvent` contenga `cancel_event_with_ledger`

**Nessuna migrazione SQL necessaria**: la RPC e il trigger esistono gia' e funzionano correttamente.

### Flusso dopo il fix

```text
Coach clicca "Elimina" in agenda
        |
        v
useDeleteEvent.mutationFn
        |
        +-- buildEventSnapshot (per email)
        |
        +-- supabase.rpc('cancel_event_with_ledger', { p_actor: 'coach' })
        |       |
        |       +-- Ledger: HOLD_RELEASE (credito restituito)
        |       +-- Package: on_hold_sessions - 1
        |       +-- Event: session_status = 'canceled', canceled_by = 'coach'
        |       |
        |       +-- [TRIGGER] notify_client_event_canceled
        |               +-- INSERT client_notifications (tipo: appointment_canceled_by_coach)
        |
        +-- queueBookingEmailWithSnapshot (email al cliente)
```

### Impatto

- Crediti pacchetto sempre ripristinati quando il coach cancella
- Notifica in-app sempre generata per il cliente
- Email di cancellazione invariata (gia' funzionante)
- Nessun impatto su altri flussi (client cancel, series cancel)
