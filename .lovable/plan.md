
Obiettivo
- Allineare in modo “pixel-perfect” icona e titolo delle due sezioni (“Lezione singola” e “Pacchetti di lezioni”) senza ricorrere a micro-offset (mt-*) che restano fragili al variare di font-size/line-height.

Problema (perché il fix precedente non basta)
- Attualmente icona + (titolo+descrizione) sono nello stesso contenitore `flex items-start`.
- L’icona viene quindi “ancorata” all’altezza dell’intero blocco (che include anche la descrizione), e qualsiasi `mt-*` resta un compromesso visivo.
- Il design system “Settings” già usato altrove (es. Prenotazioni self-service) allinea icon + label sulla stessa riga con `items-center` e lascia la descrizione su riga separata.

Soluzione (micro-intervento, nessun refactor logico)
- Separare semanticamente:
  1) Riga 1: icona + titolo (flex items-center)
  2) Riga 2: descrizione (indentata per partire sotto il titolo, non sotto l’icona)
- Rimuovere `mt-1` dalle icone (non serve più).

File da modificare
- src/features/products/components/ProductCatalogSettings.tsx

Modifiche puntuali

1) Sezione “Lezione singola”: rendere icon+titolo una riga allineata
- Sostituire:
  - `div.flex items-start gap-3` con un wrapper `div.space-y-1`
  - Prima riga: `div.flex items-center gap-2` con icona + h4
  - Seconda riga: `p` con `pl-7` per allineare il testo sotto al titolo (20px icona + 8px gap = 28px → pl-7)
- Rimuovere `mt-1` dall’icona `CreditCard`
- Aggiornare l’indent del campo prezzo da `pl-8` a `pl-7` così resta perfettamente allineato con il testo della descrizione (stessa colonna del titolo)

Esempio struttura desiderata:
- Header sezione:
  - riga 1: (icon + titolo) -> `flex items-center gap-2`
  - riga 2: descrizione -> `pl-7`
- Input prezzo -> `pl-7`

2) Sezione “Pacchetti di lezioni”: stesso pattern, mantenendo CTA a destra
- Nel blocco `flex items-start justify-between`:
  - a sinistra usare un wrapper `div.space-y-1 min-w-0`
  - Prima riga: `div.flex items-center gap-2` con `Package` + h4
  - Seconda riga: `p` con `pl-7`
- Rimuovere `mt-1` dall’icona `Package`
- Lasciare il bottone “Nuovo pacchetto” invariato (outline sm), perché l’allineamento richiesto riguarda icon+title; se dopo il fix risultasse troppo “alto” rispetto al titolo possiamo micro-regolare con `mt-0.5` sul bottone, ma solo se necessario.

Diff concettuale (indicativo)
- CreditCard / Package:
  - da `className="... mt-1 ..."` a `className="... shrink-0"` (senza mt)
- Container:
  - da `flex items-start ...` con icona accanto a (titolo+desc)
  - a `space-y-1` con:
    - riga icon+title: `flex items-center gap-2`
    - desc indentata: `pl-7`
- Input prezzo:
  - `pl-8` -> `pl-7` per mantenere la colonna perfettamente allineata

Criterio di accettazione (come verificare)
- Icona e titolo devono risultare allineati sulla stessa “riga” (centro ottico) in entrambe le sezioni, senza bisogno di `mt-*`.
- La descrizione deve partire sotto il titolo (non sotto l’icona).
- Il campo prezzo deve partire sotto la stessa colonna del testo (coerenza visiva verticale).
