

## Notifica al cliente quando il coach assegna un nuovo piano

### Cosa cambia

Quando il coach assegna un piano, il cliente riceve una notifica in-app (visibile nella campanella e nella pagina Notifiche) con titolo e nome del piano.

### Modifiche

**1. Migrazione SQL -- Inserimento notifica dentro `fsm_assign_plan`**

Aggiungere un `INSERT INTO client_notifications` alla fine della funzione RPC `fsm_assign_plan`, subito prima del `RETURN`. La notifica viene creata atomicamente nella stessa transazione dell'assegnazione.

```sql
INSERT INTO client_notifications (client_id, type, title, message, related_id, related_type)
VALUES (
  p_client_id,
  'plan_assigned',
  'Nuovo piano assegnato',
  'Il tuo coach ti ha assegnato il piano "' || p_plan_name || '"',
  v_new_plan_id,
  'plan'
);
```

Aggiungere anche il valore `plan_assigned` al CHECK constraint della colonna `type` (se presente), oppure verificare che la colonna accetti valori liberi.

**2. `src/features/client-notifications/types.ts` -- Nuovo tipo**

Aggiungere `"plan_assigned"` all'union type `ClientNotificationType`.

**3. `src/features/client-notifications/components/ClientNotificationItem.tsx` -- Icona e colore**

- In `getNotificationIcon`: aggiungere `case "plan_assigned": return ClipboardList` (o icona simile da lucide-react)
- In `getIconColorClass`: aggiungere `case "plan_assigned": return "text-blue-500"`

### Dettaglio tecnico

La funzione `fsm_assign_plan` attuale (nella migrazione `20260207195044`) ha gia' tutti i dati necessari: `p_client_id`, `p_plan_name`, `v_new_plan_id`. L'INSERT della notifica viene aggiunto prima del RETURN finale (riga 100), cosi' se l'inserimento fallisce l'intera transazione viene annullata.

Nessuna modifica necessaria ai componenti di lista o alla bell icon: il sistema di polling esistente (ogni 30s) mostrera' automaticamente la nuova notifica.

| File | Azione |
|---|---|
| Nuova migrazione SQL | Ricreare `fsm_assign_plan` con INSERT notifica |
| `src/features/client-notifications/types.ts` | Aggiungere `"plan_assigned"` al tipo |
| `src/features/client-notifications/components/ClientNotificationItem.tsx` | Icona e colore per `plan_assigned` |

