
# Piano: Semplificazione UI Sezione Lezione Singola

## Panoramica
Rimuovere il pulsante "Ripristina", eliminare il toast di successo, e verificare/rimuovere la linea grigia laterale per un'interfaccia più pulita.

---

## Modifiche

### File 1: `ProductCatalogSettings.tsx`

#### 1.1 — Rimuovere la funzione `handleRestorePrice` (righe 75-79)
```typescript
// RIMUOVERE:
const handleRestorePrice = () => {
  if (singleSession) {
    setLocalPrice(singleSession.price_cents);
  }
};
```

#### 1.2 — Rimuovere la variabile `hasLocalChanges` (riga 81)
```typescript
// RIMUOVERE:
const hasLocalChanges = singleSession && localPrice !== singleSession.price_cents;
```

#### 1.3 — Semplificare il blocco helper (righe 165-177)
Da:
```tsx
{/* Helper + Ripristina */}
<div className="flex items-center gap-2 text-xs text-muted-foreground">
  <span>Influisce sullo sconto mostrato nei pacchetti · Salvataggio automatico</span>
  {hasLocalChanges && !updateProduct.isPending && (
    <button
      type="button"
      onClick={handleRestorePrice}
      className="text-xs text-primary hover:underline"
    >
      Ripristina
    </button>
  )}
</div>
```

A:
```tsx
<p className="text-xs text-muted-foreground">
  Influisce sullo sconto mostrato nei pacchetti · Salvataggio automatico
</p>
```

---

### File 2: `useProducts.ts`

#### 2.1 — Rimuovere il toast di successo da `useUpdateProduct` (riga 61)
Da:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["products"] });
  toast.success("Prodotto aggiornato");
},
```

A:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["products"] });
  // Feedback visivo gestito inline nel componente (no toast)
},
```

---

### File 3: `PriceInput.tsx` (linea grigia)

#### Analisi
La "linea grigia a sinistra" visibile nello screenshot appare essere il bordo standard dell'input (`border-input`). Durante il salvataggio non c'è nessuna logica che modifica lo styling dell'input.

#### Possibili cause
1. **Stato di focus residuo**: Il ring di focus potrebbe persistere brevemente
2. **Contrasto del bordo**: Il colore `border-input` potrebbe apparire più evidente in certe condizioni

#### Soluzione proposta
Dato che l'input usa i componenti standard shadcn, la linea grigia è semplicemente il bordo normale. Per confermare, posso:

1. Aggiungere temporaneamente un'ombra interna trasparente durante l'aggiornamento
2. Oppure verificare se compare solo in un browser specifico

**Domanda**: Puoi confermare se la linea grigia compare sempre durante il salvataggio o solo in determinate condizioni? Potrebbe essere utile vedere se persiste dopo il refresh o se è solo momentanea.

---

## Riepilogo

| File | Modifica |
|------|----------|
| `ProductCatalogSettings.tsx` | Rimuovere `handleRestorePrice`, `hasLocalChanges`, e il pulsante Ripristina |
| `useProducts.ts` | Rimuovere `toast.success("Prodotto aggiornato")` da `useUpdateProduct` |
| `PriceInput.tsx` | Nessuna modifica necessaria (il bordo è lo stile standard dell'input) |

---

## Risultato Finale

```text
┌─────────────────────────────────────────────────────┐
│ 💳 Lezione singola                                  │
│    Imposta il prezzo di default di una lezione.    │
│                                                     │
│    [  80,00  €          ]   ✓ Salvato              │
│    Influisce sullo sconto nei pacchetti · Auto-save│
└─────────────────────────────────────────────────────┘
```

- Nessun pulsante "Ripristina"
- Nessun toast popup
- Solo feedback inline "Salvataggio…" / "Salvato ✓"
