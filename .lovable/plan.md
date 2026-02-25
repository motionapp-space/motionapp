

## Fix: Click su "Da incassare" non deve disattivare il filtro

### Problema
Attualmente il click sulla card "Da incassare" funziona come un toggle: se il filtro e gia attivo, lo disattiva e il feed torna su "Tutti". L'utente vuole che il click non faccia nulla se il filtro e gia attivo.

### Soluzione

**File: `src/pages/Payments.tsx`** (riga 28-32)

Cambiare la logica del callback da toggle a "attiva solo":

```tsx
// Prima (toggle):
const handleFilterOutstanding = useCallback(() => {
  setKpiFilter((prev) =>
    prev?.type === "outstanding" ? null : { type: "outstanding" }
  );
}, []);

// Dopo (attiva solo, no-op se gia attivo):
const handleFilterOutstanding = useCallback(() => {
  setKpiFilter((prev) =>
    prev?.type === "outstanding" ? prev : { type: "outstanding" }
  );
}, []);
```

Un singolo carattere cambia: `null` diventa `prev`. Se il filtro e gia attivo, restituisce lo stesso oggetto e non succede nulla. Se non e attivo, lo attiva normalmente.

