
# Piano Implementazione: Salvataggio Prezzo Lezione Singola

## Obiettivo
Garantire che il prezzo della lezione singola venga sempre salvato correttamente, anche per coach senza un prodotto `single_session` esistente, prevenendo duplicati a livello database.

---

## Modifiche da Implementare

### 1. Migrazione Database: Indice UNIQUE Parziale

Creare un indice univoco parziale che garantisce **un solo prodotto `single_session` per coach**, senza bloccare i pacchetti multipli.

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_coach_single_session 
ON products (coach_id) 
WHERE type = 'single_session';
```

---

### 2. Backend: Upsert in `signup-coach`

Aggiungere Step 4 dopo l'assegnazione del ruolo coach per creare il prodotto di default.

**File:** `supabase/functions/signup-coach/index.ts`

Dopo la riga 167 (dopo `console.log` del ruolo), aggiungere:

```typescript
// Step 4: Create default single_session product
const { error: productError } = await supabaseAdmin
  .from("products")
  .insert({
    coach_id: userId,
    name: "Lezione singola",
    type: "single_session",
    credits_amount: 1,
    price_cents: 5000, // Default 50€
    duration_months: 12,
    is_active: true,
    is_visible: true,
    sort_order: 0,
  });

if (productError) {
  // Log ma non bloccare - indice UNIQUE impedisce duplicati
  // Frontend gestira creazione se necessario
  console.warn("[signup-coach] Default product creation failed:", productError.message);
} else {
  console.log(`[signup-coach] Default single_session product created for: ${userId}`);
}
```

---

### 3. Frontend: `ProductCatalogSettings.tsx`

Modificare `handlePriceBlur` per gestire tre scenari:
1. Prodotto esiste → UPDATE
2. Prodotto non esiste → CREATE
3. Conflict durante CREATE → Refetch + UPDATE (fallback)

**Modifiche:**

**a) Aggiungere import `useQueryClient`:**
```typescript
import { useQueryClient } from "@tanstack/react-query";
```

**b) Aggiungere `refetch` dal hook e `queryClient`:**
```typescript
const { data: products, isLoading, refetch } = useProducts();
const queryClient = useQueryClient();
```

**c) Aggiungere helper per feedback:**
```typescript
const showSavedFeedback = () => {
  setShowSaved(true);
  if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
  savedTimeoutRef.current = window.setTimeout(() => {
    setShowSaved(false);
  }, 3500);
};
```

**d) Riscrivere `handlePriceBlur`:**
```typescript
const handlePriceBlur = async () => {
  // Skip se il prezzo non e cambiato e il prodotto esiste
  if (singleSession && localPrice === singleSession.price_cents) {
    return;
  }

  try {
    if (singleSession) {
      // Caso 1: Prodotto esiste → UPDATE
      await updateProduct.mutateAsync({
        productId: singleSession.id,
        input: { price_cents: localPrice },
      });
      showSavedFeedback();
    } else {
      // Caso 2: Prodotto NON esiste → CREATE
      try {
        await createProduct.mutateAsync({
          name: "Lezione singola",
          type: "single_session",
          credits_amount: 1,
          price_cents: localPrice,
          duration_months: 12,
          is_active: true,
          is_visible: true,
          sort_order: 0,
        });
        showSavedFeedback();
      } catch (createError: unknown) {
        // Caso 3: Conflict (duplicate key) → Refetch + UPDATE
        const errorMessage = createError instanceof Error 
          ? createError.message 
          : String(createError);
          
        if (errorMessage.includes("duplicate") || errorMessage.includes("unique") || errorMessage.includes("23505")) {
          // Race condition: prodotto creato da altro processo
          await queryClient.invalidateQueries({ queryKey: ["products"] });
          
          const refreshedProducts = await refetch();
          const refreshedSingle = refreshedProducts.data?.find(
            p => p.type === "single_session"
          );
          
          if (refreshedSingle) {
            await updateProduct.mutateAsync({
              productId: refreshedSingle.id,
              input: { price_cents: localPrice },
            });
            showSavedFeedback();
          }
        } else {
          throw createError;
        }
      }
    }
  } catch {
    // Errore gia gestito dal hook (toast)
  }
};
```

**e) Aggiornare indicatore di loading per includere createProduct:**
```typescript
{(updateProduct.isPending || createProduct.isPending) && (
  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
    <Loader2 className="h-4 w-4 animate-spin" />
    Salvataggio…
  </span>
)}
{showSaved && !updateProduct.isPending && !createProduct.isPending && (
  // ...
)}
```

---

## Riepilogo File

| File | Azione |
|------|--------|
| Nuova migrazione SQL | Indice UNIQUE parziale su `(coach_id) WHERE type = 'single_session'` |
| `supabase/functions/signup-coach/index.ts` | Step 4: INSERT prodotto default dopo ruolo |
| `src/features/products/components/ProductCatalogSettings.tsx` | handlePriceBlur con CREATE + fallback conflict |

---

## Flusso Risultante

```text
Coach apre Settings → Tab "Lezioni e pacchetti"
         |
         v
   useProducts() carica prodotti
         |
         ├─ singleSession trovato
         |         |
         |         v
         |   Modifica prezzo → onBlur
         |         |
         |         v
         |   updateProduct() → "Salvato" ✓
         |
         └─ singleSession === undefined
                   |
                   v
             Modifica prezzo → onBlur
                   |
                   v
             createProduct()
                   |
                   ├─ OK → "Salvato" ✓
                   |
                   └─ Conflict (duplicate)
                             |
                             v
                       refetch() → trova prodotto
                             |
                             v
                       updateProduct() → "Salvato" ✓
```

---

## Vantaggi

| Aspetto | Prima | Dopo |
|---------|-------|------|
| Integrita DB | Duplicati possibili | Impossibili (indice UNIQUE) |
| Race conditions | Non gestite | Fallback automatico |
| Nuovi coach | Nessun prodotto | Prodotto default creato alla registrazione |
| Coach esistenti senza prodotto | Salvataggio fallisce silenziosamente | CREATE automatico al primo salvataggio |
| UX | Nessun feedback visibile | "Salvato" sempre mostrato |
