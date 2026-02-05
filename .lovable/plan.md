

# Piano: Correzione Copy NextStepsPanel

## Problema

Il testo "Aggiungi una sessione al calendario" è concettualmente errato. Un **appuntamento** è un evento a calendario, non una sessione di allenamento. La sessione si registra **da** un appuntamento.

## Modifica

### `src/features/clients/components/NextStepsPanel.tsx`

**Linea 57** — Correggere il copy:

```typescript
// Da:
<p className="text-xs text-muted-foreground font-normal">
  Aggiungi una sessione al calendario
</p>

// A:
<p className="text-xs text-muted-foreground font-normal">
  Aggiungi un evento al calendario
</p>
```

## Coerenza Terminologica

| Termine | Significato |
|---------|-------------|
| **Appuntamento** | Evento a calendario (incontro pianificato) |
| **Sessione** | Allenamento registrato (può partire da un appuntamento) |

Questa modifica allinea il copy al modello concettuale già presente nel resto dell'app.

