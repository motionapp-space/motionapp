
# Fix errore "Could not find the 'client_id' column of 'events'"

## Problema

Nella funzione `handleUpdate` di `EventEditorModal.tsx` (riga 762), quando si modifica un appuntamento esistente, il payload inviato contiene `client_id: formData.clientId`. Ma la tabella `events` non ha una colonna `client_id` -- usa `coach_client_id`.

La funzione `handleCreate` (riga 510-514) gestisce correttamente la conversione chiamando `getCoachClientId(formData.clientId)`, ma `handleUpdate` no.

## Soluzione

Modificare `handleUpdate` in `src/features/events/components/EventEditorModal.tsx` (righe 757-769):

- Aggiungere la conversione `formData.clientId` → `coach_client_id` tramite `getCoachClientId`
- Sostituire `client_id` con `coach_client_id` nel payload

```typescript
// Prima (riga 757-769)
try {
  await updateEvent.mutateAsync({
    id: event.id,
    data: {
      title: formData.title,
      client_id: formData.clientId,        // ERRORE: colonna inesistente
      start_at: eventStartDateTime.toISOString(),
      ...
    }
  });

// Dopo
try {
  const coachClientId = await getCoachClientId(formData.clientId);
  await updateEvent.mutateAsync({
    id: event.id,
    data: {
      title: formData.title,
      coach_client_id: coachClientId,      // CORRETTO
      start_at: eventStartDateTime.toISOString(),
      ...
    }
  });
```

Un solo file, una sola modifica: aggiungere una riga e rinominare il campo.
