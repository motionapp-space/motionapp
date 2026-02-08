
## Rimuovere i filtri obsoleti "Ultimo Piano"

### Contesto
La colonna "Ultimo Piano" (basata sulle settimane dall'assegnazione) è stata sostituita dalla colonna "Piano" con un indicatore booleano (piano attivo sì/no). I filtri avanzati mostrano ancora le opzioni basate sulle settimane che non hanno più senso con la nuova logica.

### Modifiche da effettuare

**File: `src/pages/Clients.tsx`**

1. **Rimuovere la sezione "Ultimo Piano" dai filtri avanzati** (righe 1183-1211)
   - Eliminare l'intero RadioGroup con le opzioni:
     - Tutti
     - Nessun piano
     - 0-4 settimane
     - 4-8 settimane
     - 8+ settimane

2. **Aggiornare la logica di reset dei filtri** (riga 1275)
   - Rimuovere `planWeeksRange: undefined` dalla funzione di reset

### Risultato
I filtri avanzati mostreranno solo:
- Stato Pacchetto
- Appuntamenti

Il filtro "Piano attivo" rapido (toggle esistente) rimane disponibile per filtrare i clienti con/senza piano attivo.
