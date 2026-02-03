

# Piano: Ottimizzazione Caricamento Homepage Coach

## Problema Identificato

L'hook `useOnboardingState` esegue **6 query separate** e alcune sono sequenziali:

| Query | Tabelle coinvolte | Dipendenze |
|-------|-------------------|------------|
| `nonArchivedCountQuery` | `coach_clients` + `clients` | - |
| `clientsQuery` | `coach_clients` + `clients` + **edge function** | - |
| `coachClientsQuery` | `coach_clients` | - |
| `plansQuery` | `client_plans` | Aspetta `coachClientsQuery` |
| `eventsQuery` | `events` | Aspetta `coachClientsQuery` |
| `archivedQuery` | `coach_clients` + `clients` | - |

Inoltre:
- Ogni query verifica sessione separatamente (`supabase.auth.getSession()`)
- `clientsQuery` invoca l'edge function `compute-client-data` (latenza extra ~300-500ms)
- Lo stato `isAuthenticated === null` causa flash della pagina "Benvenuto"

**Tempo totale stimato: 800-1400ms**

---

## Soluzione

### 1. Nuova RPC Function: `get_coach_onboarding_data`

Creare una funzione PostgreSQL che ritorna tutti i dati di onboarding in una singola chiamata.

**File migration:** `supabase/migrations/[timestamp]_coach_onboarding_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION public.get_coach_onboarding_data(p_coach_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
BEGIN
  -- Auth check: solo il coach puo chiamare per se stesso
  IF p_coach_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  WITH coach_client_ids AS (
    SELECT id AS coach_client_id, client_id
    FROM coach_clients
    WHERE coach_id = p_coach_id
      AND status = 'active'
  ),
  has_active AS (
    SELECT EXISTS (
      SELECT 1
      FROM clients c
      INNER JOIN coach_client_ids cc ON c.id = cc.client_id
      WHERE c.archived_at IS NULL
    ) AS val
  ),
  has_archived AS (
    SELECT EXISTS (
      SELECT 1
      FROM clients c
      INNER JOIN coach_client_ids cc ON c.id = cc.client_id
      WHERE c.archived_at IS NOT NULL
    ) AS val
  ),
  has_plan AS (
    SELECT EXISTS (
      SELECT 1
      FROM client_plans cp
      INNER JOIN coach_client_ids cc ON cp.coach_client_id = cc.coach_client_id
      WHERE cp.status = 'IN_CORSO'
        AND cp.deleted_at IS NULL
    ) AS val
  ),
  has_event AS (
    SELECT EXISTS (
      SELECT 1
      FROM events e
      INNER JOIN coach_client_ids cc ON e.coach_client_id = cc.coach_client_id
    ) AS val
  )
  SELECT json_build_object(
    'has_active_clients', (SELECT val FROM has_active),
    'has_archived_clients', (SELECT val FROM has_archived),
    'has_any_plan', (SELECT val FROM has_plan),
    'has_any_appointment', (SELECT val FROM has_event)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
```

**Caratteristiche:**
- `SECURITY DEFINER` per accesso ai dati via RLS
- Check `p_coach_id = auth.uid()` per sicurezza
- `EXISTS` invece di `COUNT` per performance (si ferma al primo match)
- Tutte le query usano la stessa CTE `coach_client_ids` (nessun join ripetuto)

---

### 2. Refactor `useOnboardingState.ts`

**File:** `src/features/clients/hooks/useOnboardingState.ts`

Sostituire le 6 query separate con una singola chiamata RPC.

**Interfaccia risposta:**

```typescript
interface CoachOnboardingData {
  has_active_clients: boolean;
  has_archived_clients: boolean;
  has_any_plan: boolean;
  has_any_appointment: boolean;
}
```

**Nuova implementazione:**

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth"; // o hook esistente

export type OnboardingStateType = 'ZERO_CLIENTS' | 'FIRST_CLIENT_NO_CONTENT' | 'ACTIVE_USER';

export interface OnboardingState {
  state: OnboardingStateType;
  hasActiveClients: boolean;
  hasArchivedClients: boolean;
  hasAnyPlan: boolean;
  hasAnyAppointment: boolean;
  isLoading: boolean;
}

export function useOnboardingState(): OnboardingState {
  // Usare userId dalla sessione gia disponibile in App/Layout
  // Per ora recupero qui, ma idealmente passato come prop
  const { session, isLoading: authLoading } = useAuth();
  const userId = session?.user?.id;

  const onboardingQuery = useQuery({
    queryKey: ['coach-onboarding', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_coach_onboarding_data', {
        p_coach_id: userId
      });
      if (error) throw error;
      return data as CoachOnboardingData;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  // Stato di loading: include auth pending + query loading
  const isPending = authLoading || !userId;
  const isLoading = isPending || onboardingQuery.isLoading;

  // Valori sicuri (defaults)
  const hasActiveClients = onboardingQuery.data?.has_active_clients ?? false;
  const hasArchivedClients = onboardingQuery.data?.has_archived_clients ?? false;
  const hasAnyPlan = onboardingQuery.data?.has_any_plan ?? false;
  const hasAnyAppointment = onboardingQuery.data?.has_any_appointment ?? false;

  // Determina stato onboarding
  let state: OnboardingStateType;
  if (!hasActiveClients) {
    state = 'ZERO_CLIENTS';
  } else if (!hasAnyPlan && !hasAnyAppointment) {
    state = 'FIRST_CLIENT_NO_CONTENT';
  } else {
    state = 'ACTIVE_USER';
  }

  return {
    state,
    hasActiveClients,
    hasArchivedClients,
    hasAnyPlan,
    hasAnyAppointment,
    isLoading,
  };
}
```

**Cambiamenti chiave:**
- Da 6 `useQuery` a 1 `useQuery`
- Nessuna chiamata `supabase.auth.getUser()` dentro `queryFn`
- `isPending` gestisce il flash iniziale
- Rinominato `clientsCount` in `hasActiveClients` (boolean, non count)

---

### 3. Aggiornare `Clients.tsx`

**File:** `src/pages/Clients.tsx`

Adattare l'uso dell'hook ai nuovi nomi dei campi:

```typescript
// Prima
const showArchivedToggle = onboarding.hasArchivedClients;
const showFilters = onboarding.clientsCount > 1;

// Dopo
const showArchivedToggle = onboarding.hasArchivedClients;
const showFilters = onboarding.hasActiveClients; // Almeno 1 cliente attivo
```

**Nota:** Se serve il count esatto per la logica `> 1`, si puo aggiungere un campo `active_clients_count` all'RPC. Ma per ora `hasActiveClients` boolean e sufficiente.

---

## File Coinvolti

| File | Azione |
|------|--------|
| `supabase/migrations/[timestamp]_coach_onboarding_rpc.sql` | Nuovo |
| `src/features/clients/hooks/useOnboardingState.ts` | Refactor completo |
| `src/pages/Clients.tsx` | Adattare campi rinominati |

---

## Impatto Performance

| Metrica | Prima | Dopo |
|---------|-------|------|
| Query al database | 6+ | 1 |
| Roundtrip network | 8-12 | 1 |
| Edge function calls | 1 | 0 |
| Tempo stimato | 800-1400ms | **50-100ms** |

---

## Gestione Edge Cases

1. **Errore RPC**: Il `queryFn` lancia errore, TanStack Query gestisce il retry
2. **Utente non autenticato**: `enabled: !!userId` previene chiamate inutili
3. **Auth in corso**: `isPending` mantiene lo spinner fino a dati pronti

---

## Nota su `clientsCount`

Il piano proposto usa `has_active_clients` (boolean). Se la UI ha bisogno del count esatto (es. mostrare "Hai 5 clienti"), si puo estendere l'RPC:

```sql
active_clients_count AS (
  SELECT COUNT(*) as cnt
  FROM clients c
  INNER JOIN coach_client_ids cc ON c.id = cc.client_id
  WHERE c.archived_at IS NULL
)
```

Ma per l'onboarding, i boolean sono sufficienti e piu performanti.

