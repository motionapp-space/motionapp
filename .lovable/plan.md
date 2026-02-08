
## Chiudere la modale "Salvare prima di esportare?" anche in caso di errore

### Problema
Quando l'utente clicca "Salva e esporta" ma il campo "Nome per il piano" è vuoto:
- Viene mostrato il toast di errore "Inserisci un nome per il piano"
- La modale rimane aperta, bloccando l'utente

### Comportamento desiderato
La modale deve chiudersi sempre dopo il click su "Salva e esporta", indipendentemente dal risultato del salvataggio. L'utente vedrà comunque il toast di errore e potrà correggere il problema.

### Modifica da effettuare

**File: `src/pages/ClientPlanEditor.tsx`**

Modificare la funzione `handleSaveAndExport` (righe 410-421) per chiudere sempre la modale:

```typescript
// Attuale (riga 410-421)
const handleSaveAndExport = async () => {
  const success = await handleSave();
  if (success) {
    setSaveBeforeExportOpen(false);
    // After save, we can export
    setIsExporting(true);
    try {
      exportPlanToPDF({ name, days });
    } finally {
      setIsExporting(false);
    }
  }
};

// Nuovo
const handleSaveAndExport = async () => {
  setSaveBeforeExportOpen(false); // Chiudi sempre la modale
  const success = await handleSave();
  if (success) {
    // After save, we can export
    setIsExporting(true);
    try {
      exportPlanToPDF({ name, days });
    } finally {
      setIsExporting(false);
    }
  }
};
```

### Risultato
- Click su "Salva e esporta" → la modale si chiude immediatamente
- Se il salvataggio riesce → viene generato il PDF
- Se il salvataggio fallisce (es. nome mancante) → l'utente vede il toast di errore e può inserire il nome, poi riprovare
