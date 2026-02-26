
## Fix: doppio click su "Crea appuntamento"

### Problema

Il bottone usa `createEvent.isPending` per disabilitarsi, ma quando il tipo economico non e "none" la creazione avviene tramite `supabase.rpc()` diretto, non tramite `createEvent.mutateAsync`. Quindi `isPending` resta `false` e il bottone rimane cliccabile durante la chiamata.

### Soluzione

Aggiungere uno stato locale `isSubmitting` che viene settato a `true` all'inizio di `handleCreate` e a `false` alla fine (nel `finally`). Usare questo stato per disabilitare il bottone e mostrare il testo "Salvataggio...".

### Modifiche in `src/features/events/components/EventEditorModal.tsx`

**1. Aggiungere stato `isSubmitting`** (tra gli altri `useState`)

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);
```

**2. Wrappare `handleCreate`**

```tsx
const handleCreate = async () => {
  if (!isValid || isSubmitting) return;  // guard aggiuntivo
  setIsSubmitting(true);
  try {
    // ... tutto il codice esistente ...
  } catch (...) {
    // ... gestione errori esistente ...
  } finally {
    setIsSubmitting(false);
  }
};
```

**3. Aggiornare il bottone** (riga ~1772-1777)

```tsx
<Button
  onClick={handleCreate}
  disabled={!isValid || isSubmitting}
  className="h-10 px-5 font-semibold"
>
  {isSubmitting ? 'Salvataggio...' : 'Crea appuntamento'}
</Button>
```

Stessa logica per il bottone "Salva modifiche" in modalita edit, se presente con lo stesso pattern.
