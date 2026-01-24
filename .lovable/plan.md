
# Piano: Micro-Refinement UX Tab "Lezioni e pacchetti"

## Obiettivo

Portare la tab da **8.8/10** a **9.6/10** con interventi minimi su: copy, gerarchia visiva, densità.

---

## Modifiche da Implementare

### 1. File: `ProductCatalogSettings.tsx`

#### 1.1 Header Card — Copy più "settings-like"
**Riga 96**
```diff
- Definisci i valori di default per lezioni singole e pacchetti
+ Configura i valori di default per lezioni singole e pacchetti
```

#### 1.2 Sezione Lezione Singola — Micro-copy più scan-friendly
**Righe 104-108**: Spezzare il paragrafo in due frasi logiche con `<br />`
```diff
- <p className="text-sm text-muted-foreground">
-   Imposta il prezzo di default di una lezione singola. 
-   Questo valore verrà proposto automaticamente in fase di creazione 
-   e usato come base per il calcolo dello sconto nei pacchetti.
- </p>
+ <p className="text-sm text-muted-foreground">
+   Imposta il prezzo di default di una lezione singola.
+   <br />
+   Questo valore verrà proposto automaticamente in fase di creazione e usato come base per il calcolo dello sconto nei pacchetti.
+ </p>
```

#### 1.3 Lista Pacchetti — Spacing
**Nota tecnica**: Il Tailwind config custom non include `1.5` nello spacing (solo 0, 0.5, 1, 2, 3...). 

**Decisione**: Mantengo `space-y-2` (8px) perché con il padding ridotto delle card (`p-3`) l'effetto densità è già ottenuto.

---

### 2. File: `PackageProductCard.tsx`

#### 2.1 Ridurre padding card per densità
**Riga 30**: `p-4` → `p-3` (più compatto, meno "hero")
```diff
- <CardContent className="p-4">
+ <CardContent className="p-3">
```

#### 2.2 Separare prezzo su due righe per scan verticale
**Righe 40-46**: Ristrutturare la sezione prezzo
```diff
- <div className="flex items-center gap-2 text-sm mt-1">
-   <span className="font-medium">{formatCurrency(product.price_cents)}</span>
-   <span className="text-muted-foreground">
-     ({formatCurrency(pricePerSession)}/sessione
-     {discountPercent > 0 && ` · -${discountPercent}%`})
-   </span>
- </div>
+ <div className="text-sm mt-1">
+   <div className="font-medium">{formatCurrency(product.price_cents)}</div>
+   <div className="text-muted-foreground text-xs">
+     {formatCurrency(pricePerSession)}/sessione
+     {discountPercent > 0 && ` · -${discountPercent}%`}
+   </div>
+ </div>
```

#### 2.3 Bottone Modifica — Rimuovere icona, mantenere outline
**Righe 50-53**: Bottone più leggero (solo testo, outline per coerenza con Impostazioni)
```diff
- <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
-   <Pencil className="h-4 w-4 mr-1" />
-   Modifica
- </Button>
+ <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
+   Modifica
+ </Button>
```

#### 2.4 Cleanup import
Rimuovere import `Pencil` da lucide-react (non più usato).

---

## Riepilogo Modifiche

| File | Modifica | Impatto |
|------|----------|---------|
| `ProductCatalogSettings.tsx` | Copy "Configura…" | Più settings-like |
| `ProductCatalogSettings.tsx` | `<br />` nel paragrafo | Scan-friendly |
| `PackageProductCard.tsx` | `p-3` invece di `p-4` | Card più compatte |
| `PackageProductCard.tsx` | Prezzo su 2 righe + `text-xs` | Leggibilità |
| `PackageProductCard.tsx` | Rimuovi icona Pencil | Bottone più pulito |
| `PackageProductCard.tsx` | Rimuovi import Pencil | Cleanup |

---

## Risultato Atteso

- Continuità visiva totale con le altre tab Impostazioni
- Percezione "configurazione", non "catalogo prodotti"  
- Scan verticale migliorato per liste lunghe
- Gerarchia equilibrata: Nome chiaro → Prezzo leggibile → Azione non dominante
