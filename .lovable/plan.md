

## Fix toggle "Solo già dovuti" e rimuovi chip ridondante

### File: `src/features/payments/components/PaymentFilters.tsx`

Due problemi, due fix:

---

### 1. Rimuovere la chip "Solo già dovuti"

La chip che appare sotto i filtri quando il toggle e attivo e ridondante: lo switch gia mostra lo stato. Rimuovere tutto il blocco chips (righe 31-35 e 78-91).

Eliminare:
- La variabile `chips` (riga 31)
- La logica di push (righe 33-35)
- Il blocco JSX dei chips (righe 78-91)
- L'import di `X` da lucide-react (non piu usato)

---

### 2. Fix toggle filtering

Il problema e che quando il KPI filter "Da incassare" e attivo, l'`useEffect` in `PaymentFeed.tsx` resetta `onlyDueNow` a `false` (riga 40). Se l'utente attiva il toggle mentre il KPI filter e attivo, l'effect scatta di nuovo e lo resetta.

Fix in `PaymentFeed.tsx` (riga 37-47): rimuovere `setOnlyDueNow(false)` dal ramo `kpiFilter?.type === "outstanding"`, lasciandolo solo nel ramo di reset (quando il filtro viene disattivato). Cosi il toggle resta indipendente dal KPI sync.

```
// Da:
if (kpiFilter?.type === "outstanding") {
  setStatus("outstanding");
  setOnlyDueNow(false);        // <-- rimuovere questa riga
}

// A:
if (kpiFilter?.type === "outstanding") {
  setStatus("outstanding");
}
```

---

### Riepilogo

| File | Cambio |
|------|--------|
| PaymentFilters.tsx | Rimuovere chips + import X |
| PaymentFeed.tsx | Non resettare onlyDueNow su KPI sync |

