
## Rimuovere badge "Parziale" e stabilizzare subline importi

### Cosa cambia

Eliminare il badge "Parziale" (rumore visivo) e rendere la subline degli importi sempre su 2 righe stabili per evitare oscillazioni di layout tra righe parziali e non.

### File: `src/features/payments/components/PaymentFeedItem.tsx`

**1. Rimuovere i badge "Parziale"**
- Eliminare i 2 blocchi `{isPartial && (<Badge ...>Parziale</Badge>)}` (mobile riga 124-128, desktop riga 142-146)
- Rimuovere la variabile `isPartial` (riga 45) dato che non serve piu altrove

**2. Subline a 2 righe stabili**

Sostituire la singola `<p>` subline con 2 righe fisse:

- **Outstanding parziale**: riga 1 = `Incassato 100,00 €`, riga 2 = `Totale 225,00 €`
- **Outstanding non parziale**: riga 1 = `Totale 225,00 €`, riga 2 = placeholder invisibile (`\u00A0` o `min-h`)
- **Incassato**: riga 1 = `Pagato il 5 feb 2026` (o "Pagato"), riga 2 = placeholder invisibile

Questo garantisce altezza uniforme su ogni riga del feed, sia mobile che desktop.

**3. Struttura JSX risultante (blocco importi)**

```tsx
<div className="text-right tabular-nums">
  <p className="text-sm font-semibold text-foreground">{amountMain}</p>
  <p className="mt-0.5 text-xs text-muted-foreground">
    {isPartial ? `Incassato ${formatEur(order.paid_amount_cents)}` : amountSub}
  </p>
  <p className="text-xs text-muted-foreground">
    {isPartial ? `Totale ${formatEur(order.amount_cents)}` : "\u00A0"}
  </p>
</div>
```

Dove `amountSub` per non-parziale outstanding = `Totale X`, per incassato = data pagamento.

**4. Applicare a entrambi i breakpoint**
- Blocco mobile (riga 130-133)
- Blocco desktop (riga 150-153)

Nota: `isPartial` viene mantenuta come variabile locale solo per la logica subline (non piu per badge).
