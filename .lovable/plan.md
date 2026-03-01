

## Piano: Aggiornamento RPC e ordinamento tabella Coaches

### 1. Migrazione DB — Aggiornare `admin_get_coaches_overview`

Sostituire la funzione RPC con una versione che:
- **Eventi**: esclude quelli con `canceled_by IS NOT NULL` (soft-delete degli eventi)
- **Piani**: esclude quelli con `deleted_at IS NOT NULL`
- **Ordinamento**: `ORDER BY u.first_name ASC NULLS LAST, u.last_name ASC NULLS LAST` (per nome alfabetico)

```sql
CREATE OR REPLACE FUNCTION admin_get_coaches_overview()
RETURNS TABLE(...) AS $$
  ...
  (SELECT count(*) FROM events e 
   JOIN coach_clients cc ON cc.id = e.coach_client_id 
   WHERE cc.coach_id = c.id AND e.canceled_by IS NULL),
  (SELECT count(*) FROM client_plans cp 
   JOIN coach_clients cc ON cc.id = cp.coach_client_id 
   WHERE cc.coach_id = c.id AND cp.deleted_at IS NULL),
  ...
  ORDER BY u.first_name ASC NULLS LAST, u.last_name ASC NULLS LAST
$$
```

### 2. Frontend — Ordinamento cliccabile sulla colonna Nome

Aggiornare `CoachesOverviewTable` per aggiungere un toggle di ordinamento (ASC/DESC) sulla colonna "Nome", gestito localmente con `useMemo` + stato `sortDirection`. Click sull'header inverte la direzione. Nessuna nuova dipendenza necessaria.

### Riepilogo

| Area | Azione |
|------|--------|
| DB Migration | 1 — `CREATE OR REPLACE FUNCTION admin_get_coaches_overview` |
| File modificati | 1 — `CoachesOverviewTable.tsx` (sort locale) |

