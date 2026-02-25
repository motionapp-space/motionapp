

## Allineamento globale dei Badge di stato

### Problema
I badge di stato nella piattaforma usano stili completamente diversi tra loro: alcuni con `variant="default"`, altri con `variant="destructive"`, altri con colori hardcoded (`bg-amber-50 text-amber-700`, `bg-emerald-50 text-emerald-700`), e altri ancora con `variant="secondary"`. Non c'e una regola comune.

### Regola di design da applicare ovunque
Tutti i badge di stato devono seguire lo stesso pattern gia stabilito nei badge della tabella clienti:

```text
variant="outline" + className="border-{colore}/50 bg-{colore}/10 text-foreground dark:text-{colore}"
```

### Mappa semantica dei colori

| Significato | Token colore | Esempi di stato |
|---|---|---|
| Positivo/Completato | `success` | Confermato, Attivo, Pagato, Completato |
| Attenzione/In attesa | `warning` | In attesa, Parziale, In proposta, In corso, Da approvare |
| Negativo/Critico | `destructive` | Annullato, Non pagato, Sospeso, Scartata |
| Neutro/Inattivo | `muted-foreground` | Archiviato, Nessuno, Rimborsato |

### File da modificare (12 file)

**1. `src/features/events/components/EventEditorModal.tsx`** (righe 870-896)
Badge degli eventi nel calendario coach. Attualmente usano colori hardcoded (`bg-emerald-50`, `bg-amber-50`, `bg-destructive/10`, `bg-muted/80`).

Allineare:
- Confermato: `variant="outline"` + `border-success/50 bg-success/10 text-foreground dark:text-success`
- In proposta: `variant="outline"` + `border-warning/50 bg-warning/10 text-foreground dark:text-warning`
- Annullato: `variant="outline"` + `border-destructive/50 bg-destructive/10 text-foreground dark:text-destructive`
- Completato: `variant="outline"` + `border-muted-foreground/50 bg-muted-foreground/10 text-foreground dark:text-muted-foreground`

**2. `src/features/packages/components/PackageCard.tsx`** (righe 74-97)
Badge usage e payment nella card pacchetto coach. Usano `variant="default"/"secondary"/"destructive"` generici.

Allineare entrambi i badge (usage_status e payment_status) allo stile outline con colori semantici:
- active/paid: success
- suspended/unpaid: destructive
- completed/partial: warning
- archived/refunded: muted-foreground

**3. `src/features/packages/components/PackageDetailsDrawer.tsx`** (righe 188-200, 231-237, 429-433)
Stesse mappe di stato del PackageCard ma nel drawer dettaglio. Sostituire `usageStatusMap` e `paymentStatusMap` con className semantici invece di variant generici.

**4. `src/features/sessions/components/SessionHistoryTab.tsx`** (righe 62-86)
Badge sessione (In corso, Scartata). Usano `variant="secondary"` e `variant="outline"` generici.

Allineare:
- In corso: warning
- Scartata: destructive

**5. `src/features/sessions/components/SessionDetailDrawer.tsx`** (righe 48-58)
Stessi badge sessione nel drawer. Allineare come sopra, piu:
- Completata: success

**6. `src/features/client-bookings/components/NextAppointmentCard.tsx`** (righe 15-23)
Badge appuntamento lato cliente. Usano mix di colori inconsistenti (`bg-success/10`, `bg-warning/10`, `bg-primary/5`).

Allineare:
- Confermato: success (gia quasi ok, manca `dark:text-success`)
- In attesa: warning (gia quasi ok)
- Proposta modifica: warning

**7. `src/features/client-bookings/components/FutureAppointmentCard.tsx`** (righe 15-19)
Stessi badge, stessa correzione.

**8. `src/features/client-bookings/components/AppointmentDetailSheet.tsx`** (righe 19-54)
Badge nel dettaglio appuntamento cliente. Usano `bg-primary/10 text-primary`, `variant="secondary"`, `bg-amber-100 text-amber-700`, `variant="destructive"`.

Allineare tutti allo stile outline semantico.

**9. `src/features/client-bookings/components/ConfirmedCard.tsx`** (riga 32)
Badge "Confermato" con `bg-primary/10 text-primary`. Allineare a success.

**10. `src/features/client-bookings/components/RequestedCard.tsx`** (riga 32)
Badge "In attesa" con `variant="secondary"`. Allineare a warning.

**11. `src/features/client-bookings/components/ChangeProposalCard.tsx`** (riga 41)
Badge "In attesa" con `text-amber-700 border-amber-300 bg-amber-100`. Allineare a warning con token di sistema.

**12. `src/features/client-bookings/components/PendingRequestCard.tsx`** (riga 30)
Badge "In attesa" con `variant="secondary"`. Allineare a warning.

**13. `src/features/bookings/components/PendingRequestCard.tsx`** (riga 54)
Badge "Da approvare" coach con `bg-primary/10 text-primary`. Allineare a warning.

**14. `src/features/bookings/components/CounterProposedRequestCard.tsx`** (riga 45)
Badge "IN ATTESA DEL CLIENTE" con `bg-amber-500 text-white`. Allineare a warning.

**15. `src/features/bookings/components/BookingRequestDrawer.tsx`** (righe 122-131)
Badge nel drawer prenotazione coach. Usano `text-amber-600 border-amber-600` e `border-primary/20`. Allineare a warning.

**16. `src/features/payments/components/PaymentFeedItem.tsx`** (righe 99-110)
Badge pagamento. Usano `bg-emerald-50 text-emerald-700`, `bg-amber-50 text-amber-700`, `bg-foreground/5`.

Allineare:
- Pagato: success
- Da incassare: muted-foreground
- Parziale: warning

**17. `src/features/client-bookings/components/AppointmentsList.tsx`** (righe 19-33)
Badge nella lista appuntamenti cliente. Usano variant generici. Sostituire con className semantici come i precedenti.

### Nota
Non vengono toccati badge funzionali come contatori (es. `Badge variant="secondary"` che mostra un numero), solo i badge che rappresentano uno **stato semantico**.

