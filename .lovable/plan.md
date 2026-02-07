
# Eliminare la duplicazione di `active_plan_id`

## Problema

Esistono due colonne `active_plan_id` in due tabelle diverse:
- `clients.active_plan_id` -- aggiornata dalla edge function `client-fsm`
- `coach_clients.active_plan_id` -- aggiornata dall'RPC `set_active_plan`

Queste due colonne vanno fuori sincrono, causando incongruenze nella UI. Per Draco Malfoy, il coach vede "Piano Resistenza" (completato) come "in uso", mentre il piano realmente attivo e "Piano Resistenza 2".

## Soluzione

Usare **`coach_clients.active_plan_id` come unica fonte di verita** ed eliminare `clients.active_plan_id`.

Motivazione: `coach_clients` e la tabella relazionale che lega coach e cliente, ed e gia la sede naturale per lo stato della relazione (status archived/active). Il piano attivo e un concetto legato alla relazione coach-cliente, non al cliente in se.

## Modifiche necessarie

### 1. Edge function `client-fsm` (supabase/functions/client-fsm/index.ts)

Tutte le azioni che aggiornano `clients.active_plan_id` verranno modificate per aggiornare invece `coach_clients.active_plan_id`:

- **ASSIGN_PLAN**: aggiornare `coach_clients.active_plan_id` invece di `clients.active_plan_id`
- **DELETE_PLAN**: impostare `coach_clients.active_plan_id = null` invece di `clients.active_plan_id`
- **COMPLETE_PLAN**: impostare `coach_clients.active_plan_id = null` invece di `clients.active_plan_id`
- **ARCHIVE_CLIENT**: impostare `coach_clients.active_plan_id = null` (gia aggiorna coach_clients, basta aggiungere questo campo)
- **UNARCHIVE_CLIENT**: `coach_clients.active_plan_id = null` (gia aggiorna coach_clients)

### 2. API client-side per la vista cliente (src/features/client-workouts/api/client-plans.api.ts)

La funzione `getClientActivePlan()` gia legge da `coach_clients.active_plan_id` -- nessuna modifica necessaria.

### 3. API coach-side (src/features/client-plans/api/client-plans.api.ts)

La funzione `getClientPlansWithActive()` gia legge da `coach_clients.active_plan_id` -- nessuna modifica necessaria.

### 4. Rimuovere riferimenti a `clients.active_plan_id`

Cercare e aggiornare tutti i punti del codice che leggono o scrivono `clients.active_plan_id`:
- Edge function `client-fsm`: sostituire con `coach_clients`
- Eventuali altre query dirette

### 5. Correzione dati per Draco Malfoy

Eseguire una query SQL per allineare i dati:

```sql
UPDATE coach_clients
SET active_plan_id = '0758aa4e-d88e-49b9-8d21-cade2ce9aad8'
WHERE id = '1b5cd58b-8554-4bff-8640-f3c75a068c62';
```

### 6. Migrazione colonna (opzionale, fase successiva)

Dopo aver verificato che tutto funziona, si potra rimuovere la colonna `clients.active_plan_id` dal database. Questo passo viene rimandato per sicurezza.

## File da modificare

| File | Modifica |
|------|----------|
| `supabase/functions/client-fsm/index.ts` | Sostituire tutti gli update a `clients.active_plan_id` con `coach_clients.active_plan_id` |

## Risultato atteso

- Una sola fonte di verita per il piano attivo: `coach_clients.active_plan_id`
- La UI coach e la UI client leggono entrambe dallo stesso campo
- Nessun disallineamento possibile tra le due tabelle
