

## Spacing Premium 8pt — PaymentFeedItem + PaymentFeed

### File coinvolti
1. `src/features/payments/components/PaymentFeedItem.tsx` — spacing/layout
2. `src/features/payments/components/PaymentFeed.tsx` — divider softening

Nessuna logica cambia. Solo classi CSS.

---

### 1. Wrapper row (riga 82)

```
px-4 py-4 gap-3 md:px-6 md:py-4 md:gap-4
```
diventa:
```
px-4 py-6 gap-4 md:px-6 md:py-6 md:gap-4
```

- `py-6` (24px) su entrambi i breakpoint per ritmo 8pt.
- `gap-4` (16px) anche su mobile (era `gap-3`).

---

### 2. Colonna 1: stack editorial (righe 84-113)

Wrapper da `<div className="min-w-0">` a `<div className="min-w-0 space-y-2">`.

Titolo e cliente raggruppati in un sub-div con `leading-6`:
```tsx
<div className="min-w-0">
  <p className="text-sm font-medium leading-6 text-foreground truncate">{title}</p>
  <p className="text-sm leading-6 text-muted-foreground truncate">{clientName}</p>
</div>
```

Meta: rimuovere `mt-1`, ereditata da `space-y-2` (8px). Aggiungere `leading-5`:
```tsx
<div className="flex flex-wrap items-center gap-2 text-xs leading-5 text-muted-foreground">
```

---

### 3. Mobile badge+importo (righe 117-132)

Aggiungere `gap-4` al wrapper e `gap-2` ai badge:
```tsx
<div className="flex items-center justify-between gap-4 md:hidden">
  <div className="flex items-center gap-2">
```

Subline: `mt-0.5` resta (2px, ok per coppia importo/subline).

---

### 4. Colonna 2 desktop badges (riga 135)

Da `gap-1.5 md:pt-[3px]` a `gap-2 pt-1`:
```tsx
<div className="hidden md:flex items-center gap-2 pt-1">
```

`pt-1` (4px) per allineamento ottico con titolo `leading-6`.

---

### 5. Colonna 3 desktop amount (righe 147-150)

Da `md:pt-[3px]` a `pt-1`. Subline da `mt-0.5` a `mt-2` (8px):
```tsx
<div className="hidden md:block text-right tabular-nums pt-1">
  <p className="text-sm font-semibold leading-6 text-foreground">{amountMain}</p>
  <p className="mt-2 text-xs leading-5 text-muted-foreground">{amountSub}</p>
</div>
```

---

### 6. Colonna 4 azione (riga 153)

Da `pt-1 md:pt-[3px]` a `pt-1 md:pl-4`. Aggiungere `whitespace-nowrap` e `gap-2` alla CTA:
```tsx
<div className="flex items-center justify-end pt-1 md:pl-4">
```

Button CTA:
```tsx
<Button variant="ghost" className="h-9 px-3 text-sm gap-2 whitespace-nowrap">
```

---

### 7. Divider soft in PaymentFeed (riga 136)

Da `divide-y divide-border` a `divide-y divide-border/60`:
```tsx
<div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60">
```

---

### Riepilogo cambi

| # | Dove | Da | A |
|---|------|----|---|
| 1 | Wrapper py/gap | `py-4 gap-3` | `py-6 gap-4` |
| 2 | Col 1 | flat div | `space-y-2` + `leading-6` titoli |
| 3 | Mobile badges | `gap-1.5` | `gap-2` + `gap-4` wrapper |
| 4 | Desktop badges | `gap-1.5 md:pt-[3px]` | `gap-2 pt-1` |
| 5 | Desktop amount | `mt-0.5, md:pt-[3px]` | `mt-2, pt-1` + `leading-6/5` |
| 6 | CTA | `gap-1.5` | `gap-2 whitespace-nowrap` + `md:pl-4` |
| 7 | Divider | `divide-border` | `divide-border/60` |

