
# Fix: Campo Occorrenze Non Modificabile Liberamente

## Problema

Il campo numerico per le occorrenze non permette di:
- Cancellare completamente il valore
- Digitare liberamente un nuovo numero

**Causa**: La validazione nel `onChange` converte immediatamente qualsiasi valore non valido (es. stringa vuota) in `4`, impedendo la modifica libera.

```typescript
// Problema attuale (riga 191-194)
onChange={(e) => {
  const value = Math.min(52, Math.max(1, parseInt(e.target.value) || 4));
  updateConfig({ occurrenceCount: value });  // ← Validazione immediata!
}}
```

---

## Soluzione

Introdurre uno **stato locale per l'input** e validare solo quando l'utente esce dal campo (`onBlur`).

### Modifiche in RecurrenceSection.tsx

**1. Aggiungere stato locale per l'input**

```typescript
const [occurrenceInputValue, setOccurrenceInputValue] = useState<string>(
  String(config.occurrenceCount || 4)
);

// Sincronizza quando il valore esterno cambia
useEffect(() => {
  setOccurrenceInputValue(String(config.occurrenceCount || 4));
}, [config.occurrenceCount]);
```

**2. Modificare l'Input delle occorrenze**

```typescript
<Input
  type="number"
  min="1"
  max="52"
  value={occurrenceInputValue}
  onChange={(e) => {
    // Permetti qualsiasi input (incluso vuoto)
    setOccurrenceInputValue(e.target.value);
  }}
  onBlur={() => {
    // Valida e applica solo quando l'utente esce dal campo
    const parsed = parseInt(occurrenceInputValue);
    const validValue = isNaN(parsed) ? 4 : Math.min(52, Math.max(1, parsed));
    setOccurrenceInputValue(String(validValue));
    updateConfig({ occurrenceCount: validValue });
  }}
  className="w-20 h-9"
/>
```

---

## File da Modificare

| File | Azione |
|------|--------|
| `src/features/events/components/RecurrenceSection.tsx` | Aggiungere stato locale + onBlur validation |

---

## Comportamento Risultante

| Azione utente | Prima (bug) | Dopo (fix) |
|--------------|-------------|------------|
| Seleziona tutto + cancella | Torna a "4" | Campo vuoto (editabile) |
| Digita "12" | Funziona | Funziona |
| Cancella e digita "8" | Impossibile | Funziona ✓ |
| Esce dal campo vuoto | N/A | Torna a "4" (default) |
| Digita "999" e esce | N/A | Diventa "52" (max) |
