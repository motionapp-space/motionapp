
# Fix: Sincronizzazione Prezzo Lezione Singola

## Problema Identificato
La logica di sincronizzazione alle righe 47-49 causa una race condition:
- Viene eseguita ad ogni render
- Sovrascrive `localPrice` con il valore DB **prima** che React Query aggiorni la cache
- Risultato: il valore salvato viene immediatamente sovrascritto con quello vecchio

## Soluzione
Usare `useEffect` con dipendenza sul valore DB, così la sincronizzazione avviene **solo quando il valore dal server cambia effettivamente**, non ad ogni render.

---

## Modifica: `ProductCatalogSettings.tsx`

### Rimuovere il check inline (righe 47-49)
```typescript
// RIMUOVERE QUESTO:
if (singleSession && localPrice !== singleSession.price_cents && !updateProduct.isPending) {
  setLocalPrice(singleSession.price_cents);
}
```

### Sostituire con useEffect corretto
```typescript
// Sync local price ONLY when DB value actually changes
useEffect(() => {
  if (singleSession && !updateProduct.isPending) {
    setLocalPrice(singleSession.price_cents);
  }
}, [singleSession?.price_cents]);
```

### Perché funziona
- `useEffect` si attiva **solo** quando `singleSession.price_cents` cambia
- Durante la mutation (`isPending = true`), non sincronizza
- Quando il refetch porta il **nuovo** valore dal server, allora aggiorna `localPrice`

---

## Dettaglio Tecnico

| Prima (bug) | Dopo (fix) |
|-------------|------------|
| Check inline ad ogni render | `useEffect` con dipendenza |
| Sovrascrive prima del refetch | Aspetta il nuovo valore |
| Race condition | Sincronizzazione pulita |

---

## Riepilogo Modifiche

| File | Modifica |
|------|----------|
| `ProductCatalogSettings.tsx` | Rimuovere righe 47-49, aggiungere `useEffect` per sync |
