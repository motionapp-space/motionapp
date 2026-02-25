

## Refactor PaymentFeedItem a Grid -- Piano Definitivo 10/10

### File unico: `src/features/payments/components/PaymentFeedItem.tsx`

Nessuna modifica a logica, calcoli, filtri, sort, RPC. Solo layout/UI.

---

### 1. Wrapper principale (riga 62)

Da flex a grid responsive con `relative` e `min-w-0` globale:

```tsx
// Da:
<div className="flex items-center gap-4 py-4 px-6 hover:bg-muted/30 transition-colors duration-150">

// A:
<div className="relative grid min-w-0 gap-3 px-4 py-4 md:px-6 md:py-4
  md:grid-cols-[minmax(0,1fr)_140px_180px_170px] md:items-start md:gap-4
  hover:bg-muted/30 transition-colors duration-150">
```

`md:items-start` ancora le colonne 2/3/4 in alto. `relative` e `min-w-0` prevengono overflow con truncate.

---

### 2. Colonna 1 -- Titolo / Cliente / Meta (righe 64-93)

Container con `min-w-0`. Meta con `flex-wrap` e `leading-5`:

```tsx
<div className="min-w-0">
  <p className="text-sm font-medium text-foreground truncate">{title}</p>
  <p className="text-sm text-muted-foreground truncate">{clientName}</p>
  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground leading-5">
    {/* meta contenuti invariati */}
  </div>
</div>
```

Il `flex-wrap` previene clipping quando meta e lunga. `leading-5` stabilizza altezza riga.

---

### 3. Riga mobile badge+importo (NUOVA, solo mobile)

Subito dopo la colonna 1, blocco `md:hidden` con badge e importo affiancati:

```tsx
<div className="flex items-center justify-between md:hidden">
  {/* Badge (stessi del desktop) */}
  <div className="flex items-center gap-1.5">
    <Badge variant="outline" className={cn(
      "h-7 min-w-[120px] justify-center px-3 text-xs font-medium",
      isOutstanding
        ? "border-border bg-muted/60 text-foreground"
        : "border-success/40 bg-success/10 text-foreground"
    )}>
      {isOutstanding ? "Da incassare" : "Incassato"}
    </Badge>
    {isPartial && (
      <Badge variant="outline" className="h-6 rounded-full border border-warning/40 bg-warning/10 px-2 text-[10px] font-medium text-foreground">
        Parziale
      </Badge>
    )}
  </div>
  {/* Importo */}
  <div className="text-right tabular-nums">
    <p className="text-sm font-semibold text-foreground">
      {isOutstanding ? formatEur(residuo) : formatEur(order.amount_cents)}
    </p>
    <p className="mt-0.5 text-xs text-muted-foreground">
      {isOutstanding
        ? isPartial
          ? `Incassato ${formatEur(order.paid_amount_cents)} · Totale ${formatEur(order.amount_cents)}`
          : `Totale ${formatEur(order.amount_cents)}`
        : order.paid_at
          ? `Pagato il ${format(new Date(order.paid_at), "d MMM yyyy", { locale: it })}`
          : "Pagato"}
    </p>
  </div>
</div>
```

---

### 4. Colonna 2 -- Badge stato (solo desktop)

`hidden md:flex` con `md:pt-[3px]`. Badge senza colori testo semantici (Motion-compliant):

```tsx
<div className="hidden md:flex items-center gap-1.5 md:pt-[3px]">
  <Badge variant="outline" className={cn(
    "h-7 min-w-[120px] justify-center px-3 text-xs font-medium",
    isOutstanding
      ? "border-border bg-muted/60 text-foreground"
      : "border-success/40 bg-success/10 text-foreground"
  )}>
    {isOutstanding ? "Da incassare" : "Incassato"}
  </Badge>
  {isPartial && (
    <Badge variant="outline" className="h-6 rounded-full border border-warning/40 bg-warning/10 px-2 text-[10px] font-medium text-foreground">
      Parziale
    </Badge>
  )}
</div>
```

Niente `dark:text-success` o `dark:text-warning`. Solo `text-foreground` sempre.

---

### 5. Colonna 3 -- Importo (solo desktop)

`hidden md:block` con `md:pt-[3px]`. Subline sempre presente con fallback:

```tsx
<div className="hidden md:block text-right tabular-nums md:pt-[3px]">
  <p className="text-sm font-semibold text-foreground">
    {isOutstanding ? formatEur(residuo) : formatEur(order.amount_cents)}
  </p>
  <p className="mt-0.5 text-xs text-muted-foreground">
    {isOutstanding
      ? isPartial
        ? `Incassato ${formatEur(order.paid_amount_cents)} · Totale ${formatEur(order.amount_cents)}`
        : `Totale ${formatEur(order.amount_cents)}`
      : order.paid_at
        ? `Pagato il ${format(new Date(order.paid_at), "d MMM yyyy", { locale: it })}`
        : "Pagato"}
  </p>
</div>
```

Subline su paid: "Pagato il ..." (umano) con fallback "Pagato".

---

### 6. Colonna 4 -- Azione (slot unico, sempre presente)

`pt-1` su mobile per aria, `md:pt-[3px]` su desktop per allineamento ottico:

```tsx
<div className="flex items-center justify-end pt-1 md:pt-[3px]">
  {isOutstanding ? (
    <Button variant="ghost" className="h-9 px-3 text-sm gap-1.5"
      disabled={isSingle && registerPayment.isPending}
      onClick={() => { /* logica invariata */ }}>
      <Check className="h-3.5 w-3.5" />
      {isSingle && registerPayment.isPending ? "Registrazione..." : "Registra pagamento"}
    </Button>
  ) : !isFree ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-9 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      {/* menu content invariato */}
    </DropdownMenu>
  ) : null}
</div>
```

---

### 7. Dialoghi (righe 174-208)

Restano completamente invariati, fuori dalla grid.

---

### Riepilogo 6 micro-fix applicati

| # | Fix | Dettaglio |
|---|-----|-----------|
| 1 | Wrapper | `relative min-w-0` aggiunto |
| 2 | Meta wrap | `flex-wrap` + `leading-5` |
| 3 | Badge colori | Niente `dark:text-success/warning`, solo `text-foreground` + `border-success/40` / `border-warning/40` |
| 4 | Subline paid | "Pagato il ..." (non "Incassato il"), fallback "Pagato" |
| 5 | CTA mobile | `pt-1` per aria su mobile |
| 6 | Allineamento ottico | `md:pt-[3px]` (non 2px) su col 2/3/4 |

### Import aggiuntivo necessario

Aggiungere `cn` (gia disponibile in `@/lib/utils`) nell'import:

```tsx
import { cn } from "@/lib/utils";
```

