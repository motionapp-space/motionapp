

# Piano: Uniformare Tab Profilo con TabHeader

## Stato Attuale

La tab Profilo è l'unica che non usa il componente `TabHeader`:
- Inizia direttamente con le Card
- Non ha un titolo di sezione esplicito a livello pagina
- Percepita come "diversa" dalle altre tab (Piani, Appuntamenti, Sessioni, Pacchetti)

## Modifica Richiesta

Aggiungere `TabHeader` all'inizio della tab Profilo per uniformità visiva.

### File: `src/pages/ClientDetail.tsx`

**Linee 207-208** → Aggiungere TabHeader:

```typescript
import { TabHeader } from "@/components/ui/tab-header";

// ...

{/* Profile Tab */}
<TabsContent value="profile" className="space-y-6">
  {/* NUOVO: Header uniforme */}
  <TabHeader
    title="Profilo cliente"
    subtitle="Dati del cliente e stato di accesso all'app"
  />
  {/* NESSUNA CTA - le azioni sono nelle singole card */}

  {/* 1. Accesso App Cliente */}
  <Card>
    ...
  </Card>
  
  {/* resto invariato */}
</TabsContent>
```

## Risultato Visivo

```text
┌─────────────────────────────────────────────────────────────┐
│ Profilo cliente                                             │
│ Dati del cliente e stato di accesso all'app                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📱 Accesso app cliente                                  │ │
│ │ Stato di accesso del cliente all'app...                 │ │
│ │ [contenuto ClientInviteSection]                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Informazioni personali                        [✏️ Edit] │ │
│ │ Dati anagrafici e di contatto del cliente               │ │
│ │ [form fields]                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Riepilogo Modifiche

| File | Modifica |
|------|----------|
| `src/pages/ClientDetail.tsx` | Aggiungere import `TabHeader` + inserire header in tab Profilo |

## Note

- **Nessuna CTA in header**: Le azioni sono contestuali alle singole card (es. Edit su Informazioni personali)
- **Coerenza visiva**: Ora tutte e 5 le tab hanno lo stesso pattern visivo (TabHeader → contenuto)
- **Continuità percepita**: Il coach vede uniformità navigando tra le tab

