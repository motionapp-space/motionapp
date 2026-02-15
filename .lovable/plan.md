

## Fix UX Pagamenti — CTA condizionale, bug dialog, KPI cards

### 3 interventi

---

### 1. CTA "Registra pagamento" condizionale per tipo ordine

**Lezione singola** (`kind === "single_lesson"`): il click su "Registra pagamento" chiama direttamente `useRegisterPayment` con `amountCents = residuo` (full pay), senza aprire la modale. Il pagamento di una lezione e' sempre totale, mai parziale.

**Pacchetto** (`kind === "package_purchase"`): il click apre la modale `RegisterPaymentDialog` precompilata con l'importo totale del residuo (gia' funzionante, il default e' `residuo`).

Modifica in `PaymentFeedItem.tsx`:
- Importare `useRegisterPayment`
- Se `isSingle`: il Button chiama direttamente `registerPayment.mutate({ orderId, amountCents: residuo })`
- Se pacchetto: il Button apre il dialog come oggi
- La modale `RegisterPaymentDialog` viene renderizzata solo per pacchetti (non per lezioni singole)

---

### 2. Bug dialog: click su X non chiude la modale

Il problema e' nel componente `PriceInput`: quando si clicca sulla X del Dialog, il focus lascia il `PriceInput`, che triggera `handleBlur`. Il blur riscrive lo stato locale e potrebbe interferire con la chiusura del dialog.

Fix in `RegisterPaymentDialog.tsx`:
- Aggiungere `onInteractOutside` al `DialogContent` per prevenire interferenze, oppure piu' semplicemente assicurarsi che il `PriceInput` non blocchi il propagarsi dell'evento.
- Fix concreto: il problema e' che `DialogContent` di Radix usa `onPointerDownOutside` e `onInteractOutside`. La X e' dentro il DialogContent, ma il blur del PriceInput potrebbe triggerare un re-render che resetta lo stato `open`. Verificare se il problema e' nel `PriceInput.handleBlur` che chiama `onChange(0)` quando il valore e' vuoto durante la chiusura. Fix: nel `useEffect` che sincronizza, non resettare quando `open` passa a `false`.

---

### 3. KPI Cards — Rimuovere affordance nuova, tornare allo stile precedente

Rimuovere da `PaymentKPICards.tsx`:
- La logica condizionale `activeFilter === "outstanding"` / `activeFilter === "paidInMonth"` per lo stile delle card
- Il ring, il bg-foreground/5, e il border-foreground
- Tornare allo stile base uniforme: `rounded-2xl border bg-card p-6 cursor-pointer transition-colors duration-150 hover:border-foreground/20`

Rimuovere la prop `activeFilter` da `PaymentKPICards.tsx` e da `Payments.tsx` (dove viene passata).

I filtri (tabs, search, date range, toggle "Solo gia' dovuti", chip KPI) restano invariati.

---

### Sezione tecnica — File modificati

```text
src/features/payments/components/PaymentFeedItem.tsx
  - Import useRegisterPayment
  - CTA condizionale: single -> mutate diretto, package -> apre dialog
  - Disabilitare CTA se isPending (per single)

src/features/payments/components/RegisterPaymentDialog.tsx
  - Fix bug chiusura: gestire correttamente il blur del PriceInput durante la chiusura

src/features/payments/components/PaymentKPICards.tsx
  - Rimuovere prop activeFilter
  - Rimuovere stili condizionali (ring, bg-foreground/5)
  - Tornare a stile base uniforme

src/pages/Payments.tsx
  - Rimuovere prop activeFilter passata a PaymentKPICards
```

Nessun file nuovo. Nessuna modifica backend.
