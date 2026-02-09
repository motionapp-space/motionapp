

## Filtrare sessioni scartate e rimuovere label "Solo lettura"

### Modifiche

**1. `src/features/sessions/components/SessionHistoryTab.tsx`**

Filtraggio sessioni:
- Aggiungere `.filter(s => s.status !== "discarded")` dopo il filtraggio per source, in modo che le sessioni scartate non vengano mostrate in nessuna delle due tab.
- Aggiornare anche il conteggio totale nel badge per escludere le scartate.

Rimozione label "Solo lettura":
- Rimuovere il blocco JSX che mostra il badge "Solo lettura" nella `SessionCard` (righe 274-278).
- Rimuovere la classe `isReadOnly && "opacity-90"` dallo styling della Card.

### Dettaglio tecnico

**Filtraggio** -- nelle righe 44-46, dopo aver separato per source, filtrare anche per status:

```text
const withCoachSessions = sessions.filter((s) => s.source === "with_coach" && s.status !== "discarded");
const autonomousSessions = sessions.filter((s) => s.source === "autonomous" && s.status !== "discarded");
```

**Rimozione "Solo lettura"** -- nella funzione `SessionCard`:
- Eliminare il blocco `{isReadOnly && (<Badge ...>Solo lettura</Badge>)}` (righe 274-278)
- Rimuovere `isReadOnly && "opacity-90"` dalla className della Card (riga 264)

### File coinvolti

| File | Azione |
|---|---|
| `src/features/sessions/components/SessionHistoryTab.tsx` | Filtrare sessioni discarded, rimuovere badge "Solo lettura" e opacity ridotta |

