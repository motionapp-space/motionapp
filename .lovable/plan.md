
# Piano: Redesign Tab "Lezioni e pacchetti" + Modale

## Obiettivo

Trasformare la tab "Lezioni e pacchetti" da un catalogo commerciale a una semplice configurazione di **valori di default**, allineandola visivamente e concettualmente con le altre tab delle Impostazioni (Profilo, Credenziali, Prenotazioni).

---

## Analisi Attuale vs Richiesto

| Elemento | Attuale | Richiesto |
|----------|---------|-----------|
| **Struttura** | Due card separate | Una Card principale unica |
| **Lezione singola** | Card con emoji "💳" | Sezione dentro la card principale |
| **Pacchetti header** | Icona Package + "I tuoi pacchetti" | Titolo sezione + CTA in alto a destra |
| **Ordinamento** | Drag & drop (DnD) | Automatico per n° sessioni (crescente) |
| **Card pacchetto** | Drag handle + menu kebab | Solo bottone "Modifica" |
| **Azioni pacchetto** | Modifica/Duplica/Nascondi/Elimina | Solo Modifica |
| **Modale campi** | 7 campi + 2 toggle | 4 campi obbligatori |
| **Toggle Attivo/Visibile** | Presenti | Rimossi |
| **Descrizione** | Campo opzionale | Rimosso |

---

## Modifiche da Implementare

### 1. File: `src/features/products/components/ProductCatalogSettings.tsx`

**Trasformazione completa:**

- Rimuovere tutti gli import DnD (`@dnd-kit/*`)
- Rimuovere `DndContext`, `SortableContext`, sensors
- Struttura: **una sola Card** con due sezioni interne
- Ordinamento pacchetti: `.sort((a, b) => a.credits_amount - b.credits_amount)`
- Rimuovere `AlertDialog` per eliminazione (non c'è più azione elimina)
- Rimuovere handler: `handleDuplicateProduct`, `handleToggleVisibility`, `handleDeleteClick`, `handleConfirmDelete`

**Nuova struttura JSX:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Lezioni e pacchetti</CardTitle>
    <CardDescription>
      Definisci i valori di default per lezioni singole e pacchetti
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-8">
    
    {/* SEZIONE 1: Lezione singola */}
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-lg font-semibold">Lezione singola</h4>
        <p className="text-sm text-muted-foreground">
          Imposta il prezzo di default di una lezione singola. 
          Questo valore verrà proposto automaticamente in fase di creazione 
          e usato come base per il calcolo dello sconto nei pacchetti.
        </p>
      </div>
      <PriceInput ... /> {/* full-width */}
    </div>

    {/* SEZIONE 2: Pacchetti */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-lg font-semibold">Pacchetti di lezioni</h4>
          <p className="text-sm text-muted-foreground">
            Definisci i pacchetti predefiniti che potrai assegnare ai clienti.
          </p>
        </div>
        <Button onClick={handleCreateProduct} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Nuovo pacchetto
        </Button>
      </div>

      {/* Lista pacchetti ordinati per sessioni */}
      <div className="space-y-2">
        {sortedPackages.map(product => (
          <PackageCard ... />
        ))}
      </div>
    </div>
    
  </CardContent>
</Card>
```

---

### 2. File: `src/features/products/components/PackageProductCard.tsx` → Semplificare

**Rimozioni:**
- Import `useSortable` da `@dnd-kit/sortable`
- Import `CSS` da `@dnd-kit/utilities`
- Import `GripVertical`, `MoreVertical`, `Copy`, `EyeOff`, `Eye`, `Trash2`
- Import `DropdownMenu` e relativi
- Hook `useSortable` e logica drag
- Props: `onDuplicate`, `onToggleVisibility`, `onDelete`
- Badge "Inattivo" e "Nascosto"
- Tutto il `DropdownMenu`

**Nuova struttura:**

```tsx
interface PackageProductCardProps {
  product: Product;
  singleSessionPrice: number;
  onEdit: (product: Product) => void;
}

export function PackageProductCard({
  product,
  singleSessionPrice,
  onEdit,
}: PackageProductCardProps) {
  const pricePerSession = product.price_cents / product.credits_amount;
  const expectedPrice = singleSessionPrice * product.credits_amount;
  const discountPercent = expectedPrice > 0 
    ? Math.round(((expectedPrice - product.price_cents) / expectedPrice) * 100) 
    : 0;

  const durationLabel = product.duration_months === 1 
    ? "1 mese" 
    : `${product.duration_months} mesi`;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Info pacchetto */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium">{product.name}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{product.credits_amount} sessioni</span>
              <span>·</span>
              <span>{durationLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              <span className="font-medium">{formatCurrency(product.price_cents)}</span>
              <span className="text-muted-foreground">
                ({formatCurrency(pricePerSession)}/sessione
                {discountPercent > 0 && ` · -${discountPercent}%`})
              </span>
            </div>
          </div>

          {/* Singola azione */}
          <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
            Modifica
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 3. File: `src/features/products/components/SingleSessionPriceCard.tsx` → Eliminare

Questo componente diventa superfluo perché la logica viene integrata direttamente in `ProductCatalogSettings.tsx`.

---

### 4. File: `src/features/products/components/ProductFormDialog.tsx` → Semplificare Modale

**Rimozioni:**
- Campo `description` (Textarea)
- Toggle `is_active`
- Toggle `is_visible`
- Aggiornare `FormValues` interface rimuovendo `description`, `is_active`, `is_visible`

**Aggiornamenti:**
- Titolo: "Nuovo pacchetto" / "Modifica pacchetto"
- Sottotitolo: "Imposta i parametri di default del pacchetto."
- CTA: "Annulla" + "Salva" / "Salva modifiche"

**Ordine campi:**
1. Numero di sessioni* (input numerico)
2. Nome pacchetto* (input testuale)
3. Prezzo totale (€)* (PriceInput + sub-info dinamica)
4. Durata validità (Select mesi)

**Nuovo JSX semplificato:**

```tsx
<form className="space-y-4">
  {/* 1. Numero sessioni */}
  <div className="space-y-2">
    <Label>Numero di sessioni *</Label>
    <Input type="number" min="1" max="100" ... />
  </div>

  {/* 2. Nome */}
  <div className="space-y-2">
    <Label>Nome pacchetto *</Label>
    <Input ... />
  </div>

  {/* 3. Prezzo */}
  <div className="space-y-2">
    <Label>Prezzo totale (€) *</Label>
    <PriceInput ... />
    <p className="text-sm text-muted-foreground">
      {pricePerSession}/sessione · -{discountPercent}% rispetto alla lezione singola
    </p>
  </div>

  {/* 4. Durata */}
  <div className="space-y-2">
    <Label>Durata validità</Label>
    <Select ... />
  </div>
</form>
```

---

### 5. Logica di Salvataggio

**Per la lezione singola:**
- Salvare immediatamente on blur (comportamento attuale, mantenuto)

**Per i pacchetti:**
- Al submit della modale, i valori `is_active` e `is_visible` vengono sempre impostati a `true` nel payload inviato all'API
- Nessun cambio lato API, solo default forzati lato client

---

## Riepilogo File da Modificare

| File | Azione |
|------|--------|
| `ProductCatalogSettings.tsx` | Refactor completo: rimuovi DnD, una Card, due sezioni |
| `PackageProductCard.tsx` | Semplifica: rimuovi drag, menu, solo "Modifica" |
| `SingleSessionPriceCard.tsx` | **Eliminare** (logica integrata in parent) |
| `ProductFormDialog.tsx` | Rimuovi campi non richiesti, aggiorna copy |

---

## Considerazioni Tecniche

### Ordinamento Automatico
```typescript
const sortedPackages = packages
  .slice()
  .sort((a, b) => a.credits_amount - b.credits_amount);
```

### Default Forzati nel Payload
```typescript
const payload: CreateProductInput = {
  name: data.name,
  credits_amount: data.credits_amount,
  price_cents: data.price_cents,
  duration_months: data.duration_months,
  description: null,      // sempre null
  is_active: true,        // sempre true
  is_visible: true,       // sempre true
  type: "session_pack",
};
```

---

## Risultato Finale

L'utente vedrà:
- Una interfaccia pulita, neutra, "da impostazioni"
- Nessuna complessità inutile (toggle, eliminazioni, riordino manuale)
- Valori di default configurabili in pochi secondi
- Perfetta continuità visiva con le altre tab
