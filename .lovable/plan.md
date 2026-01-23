
Obiettivo: risolvere sul campo “prezzo lezione singola” lo stesso problema di UX visto sul campo “numero occorrenze” (impossibile cancellare e riscrivere liberamente).

## Perché succede
Nel wizard “Nuovo appuntamento” (coach), il prezzo “Lezione singola” è un input controllato con:
- `value={(singleLessonPrice ?? defaultSinglePrice) / 100}`
- `onChange={() => setSingleLessonPrice(Math.round(parseFloat(e.target.value) * 100) || defaultSinglePrice)}`

Quando l’utente cancella il contenuto del campo:
- `e.target.value === ""`
- `parseFloat("")` produce `NaN`
- il codice fa fallback a `defaultSinglePrice`
- React ri-renderizza subito e rimette il valore nel campo
Risultato: non si riesce a svuotare e riscrivere il numero “a mano”.

## Strategia di fix
Replicare la soluzione già adottata per “occurrenceCount”:
- mantenere **uno stato locale stringa** per l’input (che può essere anche vuoto)
- fare parsing/validazione **solo su onBlur**
- se il campo è vuoto su blur: tornare al default (senza forzare mentre l’utente digita)

## Modifiche previste

### 1) EventEditorModal: aggiungere stato locale per il valore digitato
File: `src/features/events/components/EventEditorModal.tsx`

Aggiungere uno state, ad es.:
- `const [singleLessonPriceInputValue, setSingleLessonPriceInputValue] = useState<string>("");`

### 2) Sincronizzare lo state locale quando cambia il contesto
Sempre in `EventEditorModal.tsx`, aggiungere una `useEffect` che:
- quando `lessonType !== "single"` resetta `singleLessonPriceInputValue` (opzionale ma evita valori “stale”)
- quando `lessonType === "single"` imposta l’input con il valore corrente:
  - `(singleLessonPrice ?? defaultSinglePrice) / 100` come stringa
- dipendenze tipiche: `[lessonType, singleLessonPrice, defaultSinglePrice]`

Nota: formatter semplice “compatibile con input type=number” (quindi col punto decimale, senza separatori) per evitare valori come “50.00” se non desiderato.

### 3) Aggiornare l’Input per usare state locale + onBlur validation
Sostituire l’Input attuale (righe ~1459-1466) con:
- `value={singleLessonPriceInputValue}`
- `onChange={(e) => setSingleLessonPriceInputValue(e.target.value)}`
- `onBlur={() => { ... }}` dove:
  - se `singleLessonPriceInputValue.trim() === ""`:
    - `setSingleLessonPrice(null)` (così torna a usare `defaultSinglePrice`)
    - rimettere nel campo la stringa del default (così la UI resta coerente)
  - altrimenti:
    - `const parsed = parseFloat(singleLessonPriceInputValue)`
    - se `isNaN(parsed)` -> comportamento come campo vuoto (fallback al default)
    - altrimenti:
      - `const cents = Math.max(0, Math.round(parsed * 100))`
      - `setSingleLessonPrice(cents)`
      - `setSingleLessonPriceInputValue((cents/100).toString() o formatter)`

Si mantiene:
- `type="number"`, `min="0"`, `step="0.01"`, className invariata

### 4) Verifiche rapide in UI
Scenario di test:
1. Seleziona “Lezione singola”
2. Click nel campo prezzo, seleziona tutto, Canc
   - deve restare vuoto mentre digiti
3. Digita “40”
   - deve restare “40” senza reset
4. Esci dal campo (blur)
   - deve salvare `4000` centesimi
5. Cancella tutto e blur
   - deve tornare al default (es. 50€) senza bloccare l’editing

## Impatto su logica e backend
Nessuna modifica alla logica di creazione: `priceToUse = singleLessonPrice ?? defaultSinglePrice` continua a funzionare identica.
Cambiamo solo UX/input handling.

## File coinvolti
- `src/features/events/components/EventEditorModal.tsx` (unico file)

