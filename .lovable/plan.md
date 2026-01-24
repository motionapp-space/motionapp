
# Fix: Sincronizzazione Prezzo Lezione Singola in EventEditorModal

## Problema Identificato
Quando aggiorni il prezzo della lezione singola nelle impostazioni (es. da 50€ a 100€), il database viene aggiornato correttamente, **ma la cache di React Query non viene invalidata** per l'hook `usePackageSettings()` usato da `EventEditorModal`.

### Flusso del bug:
1. Utente aggiorna prezzo a 100€ in Settings
2. `useUpdateProduct` salva nel DB e invalida `["products"]` ✅
3. `EventEditorModal` usa `usePackageSettings()` con query key `["package-settings"]` ❌
4. Cache `["package-settings"]` non viene invalidata → mostra 50€ vecchio

---

## Soluzione

### File 1: `src/features/products/hooks/useProducts.ts`

Invalidare anche la query `["package-settings"]` quando un prodotto viene aggiornato, per mantenere la sincronizzazione con i componenti che usano ancora l'hook legacy.

**Modifica** alla funzione `useUpdateProduct` (riga 59-61):

Da:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["products"] });
},
```

A:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["products"] });
  // Invalidate legacy package-settings cache for backward compatibility
  queryClient.invalidateQueries({ queryKey: ["package-settings"] });
},
```

---

## Perché questa soluzione

| Approccio | Pro | Contro |
|-----------|-----|--------|
| **Invalidare package-settings** (scelto) | Fix immediato, non rompe nulla, minimo codice | Mantiene dipendenza da hook deprecato |
| Migrare EventEditorModal a useProducts | Elimina tech debt | Richiede refactoring più ampio |

La prima opzione è la più sicura e veloce. La migrazione completa può essere fatta in un secondo momento.

---

## Riepilogo

| File | Modifica |
|------|----------|
| `useProducts.ts` | Aggiungere invalidazione di `["package-settings"]` in `useUpdateProduct` |

---

## Risultato Atteso
Dopo la modifica:
1. Utente salva prezzo a 100€ nelle impostazioni
2. Cache `["products"]` E `["package-settings"]` vengono invalidate
3. Aprendo EventEditorModal, il prezzo mostrato sarà 100€ ✓
