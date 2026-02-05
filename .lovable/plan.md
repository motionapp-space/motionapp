
# Fix: Reset del toggle "Invia email di invito" dopo creazione cliente

## Problema identificato

Alla riga 203 di `src/pages/Clients.tsx`, dopo la creazione di un cliente, lo stato `withInvite` viene resettato a `false`:

```tsx
setWithInvite(false);  // BUG
```

Questo causa un comportamento inconsistente:
- Se crei un cliente e poi navighi via dalla pagina, quando torni il toggle sarà ON (il componente si rimonta)
- Ma se crei più clienti nella stessa sessione rimanendo sulla pagina `/clients`, il toggle sarà OFF dal secondo in poi

## Soluzione

Cambiare il reset a `true` per mantenere il comportamento atteso come default coerente:

```tsx
setWithInvite(true);  // Mantiene il default
```

---

## File da modificare

| File | Modifica |
|------|----------|
| `src/pages/Clients.tsx` | Riga 203: cambiare `setWithInvite(false)` in `setWithInvite(true)` |

---

## Dettaglio tecnico

```tsx
// src/pages/Clients.tsx - riga 203

// DA:
setWithInvite(false);

// A:
setWithInvite(true);
```

## Risultato atteso

Dopo questa modifica:
- Il toggle "Invia email di invito" sarà sempre ON di default
- Creare più clienti consecutivamente mostrerà sempre il dialog di conferma invito
- L'esperienza utente sarà coerente indipendentemente dal flusso di navigazione
