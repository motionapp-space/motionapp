

## Rimuovere la scritta "Target" dagli esercizi in superset/circuit

Modifica minima in `src/pages/client/ClientLiveSession.tsx`, righe 204-206.

### Cosa cambia

Il ramo `else` (esercizi non-single, cioe' superset/circuit) attualmente mostra:
- `Target · 10 rip`

Dopo la modifica mostrera' semplicemente:
- `10 rip` oppure `3 serie`

### Dettaglio tecnico

Righe 204-206 — rimuovere il prefisso `Target · `:

```ts
// Prima:
targetDisplay = exercise.reps
  ? `Target · ${exercise.reps} rip`
  : `Target · ${exercise.sets} serie`;

// Dopo:
targetDisplay = exercise.reps
  ? `${exercise.reps} rip`
  : `${exercise.sets} serie`;
```

Un file, una modifica, zero impatto su altro.
