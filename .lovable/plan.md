

## Fix: campo "Serie" nel superset troppo stretto

### Problema

Nel `GroupCard.tsx`, l'input per le serie del superset ha classe `w-12` (48px). Con le frecce del browser per `type="number"`, il contenuto viene troncato.

### Soluzione

Una modifica, una riga: cambiare `w-12` in `w-16` (64px) sull'input `sharedSets` del superset.

### Dettaglio tecnico

**File**: `src/components/plan-editor/GroupCard.tsx`, riga ~139

```
// Prima:
className="w-12 h-7 text-center ..."

// Dopo:
className="w-16 h-7 text-center ..."
```

Nessun impatto su altri componenti.

