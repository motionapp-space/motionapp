
# Piano: Eliminazione Completa del Sistema Legacy `usePackageSettings`

## Problema
Il sistema legacy `usePackageSettings` doveva essere rimosso ma è ancora attivo, causando:
- **Bug del prezzo**: prodotti con `credits_amount: 1` multipli (legacy) sovrascrivono il prezzo corretto
- **Cache non sincronizzata**: query key `["package-settings"]` separata da `["products"]`
- **Codice duplicato**: funzioni deprecate ancora in uso

## Modifiche Proposte

### File 1: `src/features/events/components/EventEditorModal.tsx`

#### 1.1 — Sostituire import (riga 12)

Da:
```typescript
import { usePackageSettings } from "@/features/packages/hooks/usePackageSettings";
```

A:
```typescript
import { useActiveProducts } from "@/features/products/hooks/useProducts";
```

#### 1.2 — Sostituire hook usage (riga 211)

Da:
```typescript
const { data: packageSettings } = usePackageSettings();
```

A:
```typescript
const { data: activeProducts } = useActiveProducts();
```

#### 1.3 — Aggiornare `defaultSinglePrice` (righe 429-432)

Da:
```typescript
const defaultSinglePrice = useMemo(() => {
  return packageSettings?.sessions_1_price ?? 5000; // 50€ default
}, [packageSettings]);
```

A:
```typescript
const defaultSinglePrice = useMemo(() => {
  const singleProduct = activeProducts?.find(p => p.type === 'single_session');
  return singleProduct?.price_cents ?? 5000; // 50€ default
}, [activeProducts]);
```

---

### File 2: `src/features/packages/hooks/usePackageSettings.ts`

**Eliminare completamente il file** — non è più usato da nessun componente dopo la modifica a EventEditorModal.

---

### File 3: `src/features/packages/components/PackageSettingsForm.tsx`

**Eliminare completamente il file** — sostituito da `ProductCatalogSettings` in Settings.tsx.

---

### File 4: `src/features/packages/api/packages.api.ts`

#### 4.1 — Rimuovere `getPackageSettings()` (righe 205-259)

Eliminare l'intera funzione deprecata.

#### 4.2 — Rimuovere `updatePackageSettings()` (righe 265-311)

Eliminare l'intera funzione deprecata.

---

### File 5: `src/features/packages/types.ts`

Rimuovere l'interfaccia `PackageSettings` se presente (verificare che non sia usata altrove).

---

### File 6: `src/features/products/hooks/useProducts.ts`

#### 6.1 — Rimuovere l'invalidazione legacy (righe 60-61)

Da:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["products"] });
  // Invalidate legacy package-settings cache for backward compatibility
  queryClient.invalidateQueries({ queryKey: ["package-settings"] });
},
```

A:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["products"] });
},
```

---

## Riepilogo Modifiche

| File | Azione |
|------|--------|
| `EventEditorModal.tsx` | Migrare a `useActiveProducts()` |
| `usePackageSettings.ts` | **Eliminare** |
| `PackageSettingsForm.tsx` | **Eliminare** |
| `packages.api.ts` | Rimuovere `getPackageSettings` e `updatePackageSettings` |
| `types.ts` | Rimuovere `PackageSettings` interface |
| `useProducts.ts` | Rimuovere invalidazione cache legacy |

---

## Vantaggi

1. **Fix immediato del bug**: il prezzo viene letto correttamente filtrando per `type: 'single_session'`
2. **Una sola fonte di verità**: solo `["products"]` query key
3. **Codice più pulito**: rimozione di ~200 righe di codice deprecato
4. **Nessun rischio di regressione futura**: eliminata la dipendenza legacy

---

## Note Tecniche

La migrazione è sicura perché:
- `useActiveProducts()` già esiste e funziona
- Filtra automaticamente per `is_active: true` e `is_visible: true`
- L'ordine è per `sort_order`, quindi il prodotto `single_session` sarà sempre presente
- Il fallback `?? 5000` garantisce un valore default se non esiste il prodotto
