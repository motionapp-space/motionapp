
# Piano: Autosave Esplicito con Feedback Live (Versione Robusta)

## Panoramica
Implementare autosave con feedback visivo e aggiornamento live degli sconti, applicando le 3 migliorie tecniche richieste.

---

## File 1: `ProductCatalogSettings.tsx`

### 1.1 — Import aggiornati
```typescript
import { useState, useRef, useEffect } from "react";
import { Plus, Loader2, Package, CreditCard, Check } from "lucide-react";
```

### 1.2 — Nuovi state e ref
```typescript
const [showSaved, setShowSaved] = useState(false);
const savedTimeoutRef = useRef<number | null>(null);
```

### 1.3 — Cleanup useEffect (evita memory leak)
```typescript
useEffect(() => {
  return () => {
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }
  };
}, []);
```

### 1.4 — Nuova `handlePriceBlur` con `mutateAsync`
```typescript
const handlePriceBlur = async () => {
  if (singleSession && localPrice !== singleSession.price_cents) {
    try {
      await updateProduct.mutateAsync({
        productId: singleSession.id,
        input: { price_cents: localPrice },
      });
      // Mostra "Salvato" per 2s
      setShowSaved(true);
      savedTimeoutRef.current = window.setTimeout(() => {
        setShowSaved(false);
      }, 2000);
    } catch {
      // Errore già gestito dal hook (toast)
    }
  }
};
```

### 1.5 — Funzione "Ripristina"
```typescript
const handleRestorePrice = () => {
  if (singleSession) {
    setLocalPrice(singleSession.price_cents);
  }
};

const hasLocalChanges = singleSession && localPrice !== singleSession.price_cents;
```

### 1.6 — Micro-copy semplificata (righe 108-112)
Da:
```tsx
<p className="text-sm text-muted-foreground pl-7">
  Imposta il prezzo di default di una lezione singola.
  <br />
  Questo valore verrà proposto automaticamente in fase di creazione e usato come base per il calcolo dello sconto nei pacchetti.
</p>
```

A:
```tsx
<p className="text-sm text-muted-foreground pl-7">
  Imposta il prezzo di default di una lezione singola.
</p>
```

### 1.7 — Nuova sezione input con feedback (righe 114-125)
```tsx
<div className="space-y-2 pl-7">
  <div className="flex items-center gap-2">
    <div className="flex-1 max-w-sm">
      <PriceInput
        value={localPrice}
        onChange={handlePriceChange}
        onBlur={handlePriceBlur}
      />
    </div>
    {/* Stato salvataggio */}
    {updateProduct.isPending && (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Salvataggio…
      </span>
    )}
    {showSaved && !updateProduct.isPending && (
      <span className="flex items-center gap-1.5 text-sm text-emerald-600">
        <Check className="h-4 w-4" />
        Salvato
      </span>
    )}
  </div>
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
</div>
```

### 1.8 — Passare `localPrice` e `isBasePriceUpdating` ai pacchetti (righe 156-162)
```tsx
<PackageProductCard
  key={product.id}
  product={product}
  singleSessionPrice={localPrice}
  isBasePriceUpdating={updateProduct.isPending}
  onEdit={handleEditProduct}
/>
```

---

## File 2: `PackageProductCard.tsx`

### 2.1 — Aggiornare interface
```typescript
interface PackageProductCardProps {
  product: Product;
  singleSessionPrice: number;
  isBasePriceUpdating?: boolean;
  onEdit: (product: Product) => void;
}
```

### 2.2 — Destrutturare nuova prop
```typescript
export function PackageProductCard({
  product,
  singleSessionPrice,
  isBasePriceUpdating,
  onEdit,
}: PackageProductCardProps) {
```

### 2.3 — Applicare opacity al badge sconto (riga 46-54)
```tsx
{discountPercent !== 0 && (
  <span className={cn(
    "text-xs font-medium px-2 py-0.5 rounded-full border transition-opacity",
    discountPercent > 0
      ? "text-emerald-600 bg-emerald-50 border-emerald-100"
      : "text-rose-600 bg-rose-50 border-rose-100",
    isBasePriceUpdating && "opacity-70"
  )}>
    {discountPercent > 0 ? `-${discountPercent}%` : `+${Math.abs(discountPercent)}%`}
  </span>
)}
```

---

## Riepilogo Migliorie Applicate

| Miglioria | Implementazione |
|-----------|-----------------|
| ✅ Cleanup timeout | `useRef` + `useEffect` cleanup |
| ✅ No override callbacks | `mutateAsync` + await |
| ✅ Naming esplicito | `isBasePriceUpdating` invece di `isUpdating` |
| ✅ Input più largo | `max-w-sm` invece di `max-w-xs` |

---

## Risultato Finale UX

```text
┌─────────────────────────────────────────────────────┐
│ 💳 Lezione singola                                  │
│    Imposta il prezzo di default di una lezione.    │
│                                                     │
│    [  50,00  €          ]   ✓ Salvato              │
│    Influisce sullo sconto nei pacchetti · Auto-save│
├─────────────────────────────────────────────────────┤
│ 📦 Pacchetti                     [+ Nuovo pacchetto]│
│    ┌───────────────────────────────────────────┐   │
│    │ Pacchetto 5 sessioni           -10%      │   │
│    │ 250,00 € · 50,00 €/sessione   [Modifica] │   │
│    └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

Durante modifica prezzo base:
- Badge sconti aggiornati **immediatamente** (usando `localPrice`)  
- Badge con `opacity-70` mentre salvataggio in corso
- Link "Ripristina" visibile se modifiche non salvate
- Stato: "Salvataggio…" → "Salvato ✓" (2s) → scompare
