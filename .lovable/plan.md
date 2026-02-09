

## Fix: Piano creato da zero non visibile nella lista

### Problema

La funzione `createClientPlanFromScratch` inserisce il piano solo nella tabella `client_plans`, senza creare un record in `client_plan_assignments`. La lista piani (`getClientPlansWithActive`) usa esclusivamente `client_plan_assignments` come source of truth per determinare quali piani mostrare. Risultato: il piano esiste nel DB ma non appare.

### Soluzione

Modificare il flusso "Crea da zero" per passare attraverso il FSM (`assignPlanToClient`), esattamente come fa gia' "Crea da template". Questo garantisce:
- Creazione del piano in `client_plans`
- Creazione dell'assignment in `client_plan_assignments` con status `ACTIVE`
- Log in `plan_state_logs`
- Notifica al cliente (`plan_assigned`, appena aggiunta)

### Dettaglio tecnico

**File: `src/features/client-plans/hooks/useCreateClientPlan.ts`**

Sostituire la chiamata a `createClientPlanFromScratch` con `assignPlanToClient` (dal modulo FSM), che gestisce l'intero ciclo di vita:

```typescript
import { assignPlanToClient } from "@/features/clients/api/client-fsm.api";

// mutationFn diventa:
mutationFn: ({ clientId, name, description, objective, days }) =>
  assignPlanToClient(clientId, {
    name,
    description,
    data: { days },
  }),
```

La funzione `assignPlanToClient` chiama l'edge function `client-fsm` con action `ASSIGN_PLAN`, che a sua volta invoca `fsm_assign_plan` — la stessa RPC usata per l'assegnazione da template.

**Nota importante**: questo significa che creare un piano da zero lo rende automaticamente il piano ATTIVO. Il precedente piano attivo viene chiuso con status `COMPLETED`. Questo e' coerente con il flusso da template e con l'aspettativa dell'utente (il piano appena creato diventa quello in uso).

### File coinvolti

| File | Azione |
|---|---|
| `src/features/client-plans/hooks/useCreateClientPlan.ts` | Usare `assignPlanToClient` invece di `createClientPlanFromScratch` |

