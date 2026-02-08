

## Chiudere la modale "Uscire senza salvare?" anche in caso di errore

### Problema
Quando l'utente clicca "Salva ed esci" ma il campo "Nome per il piano" è vuoto:
- Viene mostrato il toast di errore "Inserisci un nome per il piano"
- La modale rimane aperta, bloccando l'utente

### Comportamento desiderato
La modale deve chiudersi sempre dopo il click su "Salva ed esci", indipendentemente dal risultato del salvataggio. L'utente vedrà comunque il toast di errore e potrà correggere il problema.

### Modifica da effettuare

**File: `src/pages/ClientPlanEditor.tsx`**

Modificare la funzione `handleSaveAndExit` (righe 358-367) per chiudere sempre la modale:

```typescript
// Attuale (riga 358-367)
const handleSaveAndExit = async () => {
  const success = await handleSave();
  if (success) {
    setExitDialogOpen(false);
    pendingNavigation.current?.();
    pendingNavigation.current = null;
  }
  // If save fails, dialog stays open, user sees error toast
};

// Nuovo
const handleSaveAndExit = async () => {
  setExitDialogOpen(false); // Chiudi sempre la modale
  const success = await handleSave();
  if (success) {
    pendingNavigation.current?.();
    pendingNavigation.current = null;
  }
  // Se il salvataggio fallisce, l'utente vede il toast di errore e può correggere
};
```

### Risultato
- Click su "Salva ed esci" → la modale si chiude immediatamente
- Se il salvataggio riesce → l'utente viene reindirizzato
- Se il salvataggio fallisce (es. nome mancante) → l'utente vede il toast di errore e può inserire il nome, poi salvare di nuovo

