

## Problema UX

Il link "Storico appuntamenti" crea un'aspettativa precisa: vedere gli appuntamenti **passati**. Invece porta a una pagina "Tutti gli appuntamenti" con una tab "Futuri" selezionata di default — che duplica informazioni gia presenti nella pagina principale Prenotazioni. Il risultato e:

1. **Aspettativa tradita**: "Storico" = passato, ma atterro sui futuri
2. **Ridondanza**: gli appuntamenti futuri sono gia visibili nella pagina Prenotazioni (hero + lista)
3. **Click sprecato**: il cliente deve fare un ulteriore tap su "Passati" per ottenere cio che cercava

## Soluzione proposta

Eliminare la tab "Futuri" dalla pagina di destinazione e trasformarla in una pagina dedicata esclusivamente allo **storico passato**. La pagina Prenotazioni gia mostra tutti gli appuntamenti futuri (hero + preview), quindi non serve duplicarli altrove.

### Cambiamenti

**1. Pagina `ClientAllAppointments.tsx` — Diventa "Storico appuntamenti"**

- Rimuovere le Tabs (Futuri/Passati) e il relativo stato
- Mostrare direttamente la lista degli appuntamenti passati (COMPLETED o CONFIRMED con data nel passato), ordinati dal piu recente
- Aggiornare titolo in "Storico appuntamenti" e descrizione in "I tuoi appuntamenti passati"
- Mantenere l'empty state solo per la versione "past" (icona CalendarX, "Nessun appuntamento passato")
- Mantenere il link "Indietro" e il detail sheet

**2. Link in `ClientBookingsPage.tsx` — Nessuna modifica**

Il link "Storico appuntamenti" con icona History resta com'e: il label ora corrisponde perfettamente al contenuto della pagina di destinazione.

**3. Link "Vedi tutti" in `FutureAppointmentsPreview.tsx` — Rimuovere**

Il link "Vedi tutti gli appuntamenti" che appare quando ci sono 5+ appuntamenti futuri puntava alla stessa pagina "all". Poiche quella pagina non mostrera piu i futuri, questo link va rimosso. In alternativa, si possono semplicemente mostrare tutti gli appuntamenti futuri nella preview senza limite (sono raramente piu di 5-10).

### Dettaglio tecnico

**`ClientAllAppointments.tsx`** — Semplificazione:
- Rimuovere stato `tab` e logica `futureAppointments`
- Rimuovere componenti `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Rimuovere import `CalendarCheck` (non piu necessario)
- Renderizzare direttamente `pastAppointments.map(renderAppointmentCard)` o l'empty state
- Aggiornare header: title="Storico appuntamenti", description="I tuoi appuntamenti passati"

**`FutureAppointmentsPreview.tsx`** — Mostrare tutti i futuri:
- Rimuovere la prop `hasMore` e il relativo link
- Nel componente padre (`ClientBookingsPage.tsx`), passare `confirmed.slice(1)` invece di `confirmed.slice(1, 4)` per mostrare tutti gli appuntamenti futuri
- Rimuovere la logica `hasMoreFuture` dal `useMemo`
