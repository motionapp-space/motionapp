# Piano Refactor: Stati Cliente / Invito / Piani — Beta Minimal, Relazione-centrica

## ✅ COMPLETATO

Questo refactor ha spostato l'unica fonte di verità per lo stato del cliente dalla tabella `clients` alla relazione `coach_clients`.

### Modifiche Applicate

#### Database
- ✅ Backfill `coach_clients.status = 'archived'` da `clients.archived_at`
- ✅ Convertito `coach_clients.status = 'invited'` → `'active'`
- ✅ Nuovo constraint: `CHECK (status IN ('active', 'blocked', 'archived'))`
- ✅ Eliminata colonna `clients.status`
- ✅ Eliminata colonna `clients.archived_at`
- ✅ Aggiornata RPC `create_client_with_coach_link`
- ✅ Aggiornata RPC `get_coach_onboarding_data`
- ✅ Ricreata view `v_coach_client_details` con SECURITY INVOKER
- ✅ Indici ottimizzati su `coach_clients`

#### Edge Functions
- ✅ `client-fsm`: Archive/Unarchive ora operano su `coach_clients.status`
- ✅ `client-fsm`: Rimossi side-effect su `clients.status` da azioni piano
- ✅ `client-fsm`: Eliminata azione `NO_ACCESS_X_DAYS`
- ✅ `accept-invite`: Rimossa scrittura su `clients.status`

#### Frontend
- ✅ `clients.api.ts`: Filtri basati su `coach_clients.status`
- ✅ `types.ts`: Rimosso `ClientStatus`, aggiunto `isArchived` e `CoachClientStatus`
- ✅ `useDashboardStats.ts`: Logica basata su `coach_clients.status` (`nonArchivedClients` / `archivedClients`)
- ✅ `ClientsTable.tsx`: Usa `isArchived` invece di `archived_at`
- ✅ `useClientStore.ts`: Usa FSM edge function per archiving
- ✅ `filters.ts`: Rimosso import di `ClientStatus`

### Modello Finale

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                         MODELLO FINALE                                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   clients                                                                  │
│   └── NESSUNO STATO (solo dati anagrafici + user_id + last_access_at)     │
│                                                                            │
│   coach_clients.status                                                     │
│   └── 'active' | 'blocked' | 'archived'   ← UNICA FONTE DI VERITÀ         │
│                                                                            │
│   client_invites.status                                                    │
│   └── 'pending' | 'accepted' | 'expired' | 'revoked'   ← SEPARATO         │
│                                                                            │
│   client_plans.status                                                      │
│   └── 'IN_CORSO' | 'COMPLETATO' | 'ELIMINATO'   ← DOMINIO PIANI           │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### File Deprecati (da rimuovere in futuro)
- `src/features/clients/utils/status-utils.ts` - Non più utilizzato (legacy status enum)
- `src/features/clients/__tests__/client-fsm.test.ts` - Test da aggiornare per nuovo modello
- `src/features/clients/__tests__/integration.md` - Documentazione obsoleta
- `src/features/clients/__tests__/IMPLEMENTATION_SUMMARY.md` - Documentazione obsoleta

### Note Importanti
1. Il tipo `client_status` ENUM esiste ancora nel DB per `client_state_logs` (storico) - non eliminarlo
2. I test esistenti in `__tests__/` devono essere aggiornati per il nuovo modello relazione-centrico
3. La documentazione legacy riferisce ancora al vecchio modello a 5 stati
4. `status-utils.ts` può essere rimosso quando non più referenziato

### Non-Goals (Vietati)
- ❌ Reintrodurre stati cliente su `clients` table
- ❌ Collegare piani a stato cliente o relazione
- ❌ Usare `invited` in `coach_clients`
- ❌ Mostrare stato invito fuori da Tab Profilo
- ❌ Introdurre nuovi stati oltre `active | blocked | archived`
