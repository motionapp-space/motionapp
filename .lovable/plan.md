

# Piano Finale - 4 Micro-fix "Bulletproof"

## Obiettivo
Integrare i 4 fix di hardening nel piano "Ultimo piano → Piano attivo" per renderlo production-ready.

---

## Fix 1: `reorderByIds` - Items non previsti vanno in fondo

### Problema
Con `?? 0`, un item non presente in `orderedIds` ottiene indice 0 e salta in testa all'array.

### Soluzione

```typescript
export function reorderByIds<T extends { id: string }>(items: T[], orderedIds: string[]): T[] {
  const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
  return [...items].sort((a, b) => {
    const ai = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bi = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
}
```

### Test aggiornato

```typescript
describe("reorderByIds", () => {
  const items = [
    { id: "c", name: "C" },
    { id: "a", name: "A" },
    { id: "b", name: "B" },
    { id: "x", name: "X" },  // non in orderedIds
  ];

  it("reorders items to match id order", () => {
    const result = reorderByIds(items, ["a", "b", "c"]);
    expect(result.map(i => i.id)).toEqual(["a", "b", "c", "x"]);
  });

  it("pushes items not in orderedIds to the end", () => {
    const result = reorderByIds(
      [{ id: "z" }, { id: "a" }, { id: "y" }], 
      ["a"]
    );
    expect(result[0].id).toBe("a");
    expect(result.slice(1).map(i => i.id)).toContain("z");
    expect(result.slice(1).map(i => i.id)).toContain("y");
  });
});
```

---

## Fix 2: `sanitizeSearchQuery` - Escape backslash

### Problema
Se `q` contiene `\`, escapare solo `%` e `_` può creare sequenze ambigue (es. `a\%b` diventa `a\\%b` che potrebbe essere interpretato male).

### Soluzione

```typescript
export function sanitizeSearchQuery(q: string): string {
  return q
    .trim()
    .slice(0, 80)
    .replace(/\\/g, '\\\\')   // Escape backslash PRIMA
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}
```

### Test aggiornato

```typescript
describe("sanitizeSearchQuery", () => {
  it("trims and limits to 80 chars", () => {
    const long = "a".repeat(100);
    expect(sanitizeSearchQuery(`  ${long}  `)).toHaveLength(80);
  });

  it("escapes SQL wildcards", () => {
    expect(sanitizeSearchQuery("test%user_name")).toBe("test\\%user\\_name");
  });

  it("escapes backslash before wildcards", () => {
    expect(sanitizeSearchQuery("a\\b%")).toBe("a\\\\b\\%");
  });

  it("handles complex escaping", () => {
    expect(sanitizeSearchQuery("\\%\\_")).toBe("\\\\\\%\\\\_");
  });
});
```

---

## Fix 3: Sort legacy - Non rimuovere dal type, solo dalla UI

### Problema
Rimuovere `plan_weeks_asc`/`plan_weeks_desc` dal type union rompe URL esistenti (bookmark, link condivisi).

### Soluzione

#### 3.1 NON modificare `ClientsFilters.sort` in `types.ts`
Mantenere i valori legacy nel type:

```typescript
sort?: "updated_desc" | "updated_asc" | "name_asc" | "name_desc" | "created_desc" | "created_asc" | "plan_weeks_asc" | "plan_weeks_desc" | "package_status" | "appointment_status" | "activity_status";
```

#### 3.2 Sanitizzare in `getDefaultFilters` (filters.ts)

```typescript
export function getDefaultFilters(sp: URLSearchParams): ClientsFilters {
  // ... codice esistente ...
  
  // Sanitizza sort legacy
  let sort = sp.get("sort") as ClientsFilters['sort'];
  if (sort === "plan_weeks_asc" || sort === "plan_weeks_desc") {
    sort = "updated_desc";  // Fallback a default
  }

  return {
    // ...
    sort: sort || "updated_desc",
    // ...
  };
}
```

#### 3.3 Rimuovere SOLO dalla UI in `Clients.tsx`

```typescript
const sortOptions = [
  { value: "updated_desc", label: "Modificato di recente" },
  { value: "updated_asc", label: "Meno recente" },
  { value: "name_asc", label: "Nome A-Z" },
  { value: "name_desc", label: "Nome Z-A" },
  { value: "created_desc", label: "Creato di recente" },
  { value: "created_asc", label: "Creato meno recente" },
  // RIMOSSI dalla UI ma NON dal type:
  // { value: "plan_weeks_asc", label: "Piano (recente → scaduto)" },
  // { value: "plan_weeks_desc", label: "Piano (scaduto → recente)" },
  { value: "package_status", label: "Pacchetto (critico → ok)" },
  { value: "appointment_status", label: "Agenda (da pianificare)" },
  { value: "activity_status", label: "Attività (inattivi → attivi)" },
];
```

#### 3.4 In `clients.api.ts`, switch gestisce comunque il default

```typescript
switch (sort) {
  case "created_desc":
    idsQuery = idsQuery.order("created_at", { ascending: false });
    break;
  // ... altri casi ...
  case "plan_weeks_asc":
  case "plan_weeks_desc":
  case "updated_desc":
  default:
    idsQuery = idsQuery.order("updated_at", { ascending: false });
    break;
}
```

### Test aggiornato

```typescript
describe("getDefaultFilters", () => {
  it("sanitizes legacy plan_weeks_asc to updated_desc", () => {
    const sp = new URLSearchParams("sort=plan_weeks_asc");
    const filters = getDefaultFilters(sp);
    expect(filters.sort).toBe("updated_desc");
  });

  it("sanitizes legacy plan_weeks_desc to updated_desc", () => {
    const sp = new URLSearchParams("sort=plan_weeks_desc");
    const filters = getDefaultFilters(sp);
    expect(filters.sort).toBe("updated_desc");
  });

  it("preserves valid sort values", () => {
    const sp = new URLSearchParams("sort=name_asc");
    const filters = getDefaultFilters(sp);
    expect(filters.sort).toBe("name_asc");
  });
});
```

---

## Fix 4: Edge function test - Testare il mapping reale

### Problema
Il test attuale verifica solo un oggetto literal, non intercetta regressioni se qualcuno dimentica di mappare un campo.

### Soluzione

#### 4.1 Estrarre funzione di mapping nell'edge function

**File**: `supabase/functions/compute-client-data/index.ts`

```typescript
interface RpcRow {
  client_id: string;
  plan_weeks_since_assignment: number | null;
  package_status: string;
  appointment_status: string;
  activity_status: string;
  next_appointment_date: string | null;
  has_active_plan: boolean;
}

interface ComputedClientData {
  client_id: string;
  plan_weeks_since_assignment: number | null;
  package_status: 'active' | 'low' | 'expired' | 'none';
  appointment_status: 'planned' | 'unplanned';
  activity_status: 'active' | 'low' | 'inactive';
  next_appointment_date: string | null;
  has_active_plan: boolean;
}

/**
 * Mappa righe RPC al formato ComputedClientData
 * Esportata per testing
 */
export function mapRpcRowToComputedData(row: RpcRow): ComputedClientData {
  return {
    client_id: row.client_id,
    plan_weeks_since_assignment: row.plan_weeks_since_assignment,
    package_status: row.package_status as ComputedClientData['package_status'],
    appointment_status: row.appointment_status as ComputedClientData['appointment_status'],
    activity_status: row.activity_status as ComputedClientData['activity_status'],
    next_appointment_date: row.next_appointment_date,
    has_active_plan: row.has_active_plan ?? false,  // Fallback esplicito
  };
}

Deno.serve(async (req) => {
  // ... codice esistente ...

  const { data, error } = await supabaseClient
    .rpc('compute_client_table_data_batch', { p_client_ids: clientIds });

  if (error) {
    console.error('Database function error:', error);
    throw error;
  }

  // Usa la funzione di mapping
  const mappedData = (data || []).map(mapRpcRowToComputedData);

  console.log(`Computed data for ${mappedData.length} clients`);

  return new Response(JSON.stringify({ data: mappedData }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
```

#### 4.2 Test reale del mapping

**File**: `supabase/functions/compute-client-data/index_test.ts`

```typescript
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mapRpcRowToComputedData } from "./index.ts";

Deno.test("mapRpcRowToComputedData - maps has_active_plan correctly", () => {
  const rpcRow = {
    client_id: "uuid-1",
    plan_weeks_since_assignment: 5,
    package_status: "active",
    appointment_status: "planned",
    activity_status: "active",
    next_appointment_date: null,
    has_active_plan: true,
  };

  const result = mapRpcRowToComputedData(rpcRow);

  assertEquals(result.has_active_plan, true);
  assertExists(result.client_id);
});

Deno.test("mapRpcRowToComputedData - defaults has_active_plan to false when missing", () => {
  const rpcRowMissingField = {
    client_id: "uuid-2",
    plan_weeks_since_assignment: null,
    package_status: "none",
    appointment_status: "unplanned",
    activity_status: "inactive",
    next_appointment_date: null,
    has_active_plan: undefined as any,  // Simula campo mancante
  };

  const result = mapRpcRowToComputedData(rpcRowMissingField);

  assertEquals(result.has_active_plan, false);
});

Deno.test("mapRpcRowToComputedData - preserves all existing fields", () => {
  const rpcRow = {
    client_id: "uuid-3",
    plan_weeks_since_assignment: 3,
    package_status: "low",
    appointment_status: "unplanned",
    activity_status: "low",
    next_appointment_date: "2024-12-01T10:00:00Z",
    has_active_plan: false,
  };

  const result = mapRpcRowToComputedData(rpcRow);

  assertEquals(result.client_id, "uuid-3");
  assertEquals(result.plan_weeks_since_assignment, 3);
  assertEquals(result.package_status, "low");
  assertEquals(result.appointment_status, "unplanned");
  assertEquals(result.activity_status, "low");
  assertEquals(result.next_appointment_date, "2024-12-01T10:00:00Z");
  assertEquals(result.has_active_plan, false);
});

Deno.test("mapRpcRowToComputedData - handles null plan_weeks", () => {
  const rpcRow = {
    client_id: "uuid-4",
    plan_weeks_since_assignment: null,
    package_status: "none",
    appointment_status: "unplanned",
    activity_status: "inactive",
    next_appointment_date: null,
    has_active_plan: false,
  };

  const result = mapRpcRowToComputedData(rpcRow);

  assertEquals(result.plan_weeks_since_assignment, null);
});
```

---

## Riepilogo file aggiornato

| Tipo | File | Azione |
|------|------|--------|
| Migration | `supabase/migrations/[timestamp]_add_has_active_plan.sql` | Nuovo |
| Edge Function | `supabase/functions/compute-client-data/index.ts` | Modifica (+ mapRpcRowToComputedData) |
| Types | `src/features/clients/types.ts` | Modifica (+ has_active_plan, **NON rimuovere sort legacy**) |
| Filters | `src/features/clients/utils/filters.ts` | Modifica (sanitize sort legacy) |
| API | `src/features/clients/api/clients.api.ts` | Refactor (helpers + listClients) |
| Badge | `src/features/clients/components/badges/ActivePlanBadge.tsx` | Nuovo |
| Table | `src/features/clients/components/ClientsTable.tsx` | Modifica |
| Page | `src/pages/Clients.tsx` | Modifica (rimuovi sort options dalla UI) |
| Test | `src/features/clients/api/clients.helpers.test.ts` | Nuovo (con fix reorderByIds/sanitize) |
| Test | `src/features/clients/api/clients.api.test.ts` | Nuovo |
| Test | `src/features/clients/utils/filters.test.ts` | Nuovo (con test sort legacy) |
| Test | `src/features/clients/components/badges/ActivePlanBadge.test.tsx` | Nuovo |
| Test | `src/features/clients/components/ClientsTable.test.tsx` | Nuovo |
| Test | `supabase/functions/compute-client-data/index_test.ts` | Nuovo (test mapping reale) |

**Totale**: 6 file esistenti da modificare + 7 nuovi file

---

## Checklist finale pre-merge

- [ ] `reorderByIds` usa `Number.MAX_SAFE_INTEGER` per items mancanti
- [ ] `sanitizeSearchQuery` escapa `\` prima di `%` e `_`
- [ ] Type union `sort` mantiene valori legacy
- [ ] `getDefaultFilters` sanitizza `plan_weeks_*` → `updated_desc`
- [ ] UI `sortOptions` non mostra più `plan_weeks_*`
- [ ] Edge function esporta `mapRpcRowToComputedData` per testing
- [ ] Test verificano fallback `has_active_plan ?? false`
- [ ] Test verificano comportamento con items non in orderedIds

