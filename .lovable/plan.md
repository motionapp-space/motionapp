
Obiettivo
- Evitare che lo scroll della pagina (/payments) torni in alto quando si passa tra le tab filtro: “Tutti”, “Da incassare”, “Incassati”.

Cosa ho verificato nel codice
- `ScrollToTop` è globale ma reagisce a `location.pathname`, quindi non dovrebbe intervenire sui tab interni di `PaymentFeed` (che non cambiano route).
- Il cambio tab in `PaymentFeed` aggiorna stato locale (`status`) e ricompone la lista; durante questo re-render lo scroll del container può essere “perso”/ricalcolato dal browser in alcuni casi.
- Non ci sono altri reset espliciti di scroll in `PaymentFeed` al cambio tab.

Implementazione proposta

1) Preservare scroll attorno al cambio tab in `PaymentFeed`
- File: `src/features/payments/components/PaymentFeed.tsx`
- Aggiungere una utility locale che:
  - individua il container corretto (`coach-scroll-container`, fallback `client-scroll-container`, fallback `window`);
  - salva la posizione corrente (`scrollTop` o `window.scrollY`);
  - applica il cambio stato;
  - ripristina la posizione con doppio `requestAnimationFrame` (per coprire render + layout pass).
- Applicare questa utility dentro `handleStatusChange` (quando si cliccano le tab).

2) Applicare la stessa preservazione anche nei cambi stato “indiretti”
- Sempre in `PaymentFeed.tsx`, nell’`useEffect` di sync KPI (`kpiFilter`):
  - quando forza `setStatus("outstanding")` o `setStatus("all")`, usare la stessa utility di preservazione scroll.
- Così anche i cambi tab pilotati dai KPI non causano jump.

3) Stabilizzare il comportamento senza alterare la UX attuale
- Non cambiare logica dei filtri (toggle, search, date range), solo la gestione dello scroll durante i cambi tab.
- Nessuna modifica a componenti globali (`ScrollToTop`) per evitare side effect su altre pagine.

Validazione (E2E)
- In `/payments`, scrollare in basso (metà e fondo lista), poi cambiare:
  - `Da incassare` → `Incassati`
  - `Incassati` → `Tutti`
  - `Tutti` → `Da incassare`
- Verificare che la pagina non torni in alto dopo il click tab.
- Ripetere test con:
  - ricerca attiva,
  - range date attivo,
  - toggle “Solo già dovuti” attivo,
  - liste corte (pochi elementi) e vuote.
- Verificare anche su mobile viewport.

Note tecniche
- Caso limite: se si passa a una tab con contenuto molto più corto, il browser può comunque “clampare” lo scroll al massimo disponibile (comportamento nativo). Con il ripristino esplicito evitiamo i reset non necessari e manteniamo la posizione quando possibile.
