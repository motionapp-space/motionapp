
# Modificare il bottone "Crea template" nella dialog di assegnazione

## Cosa cambia

Il bottone "Crea template" nello stato vuoto della dialog `AssignPlanDialog` attualmente rimanda a `/library?tab=templates`. Verra modificato per navigare direttamente a `/templates/new?mode=edit`, aprendo subito l'editor per creare un nuovo template.

## File da modificare

| File | Modifica |
|------|----------|
| `src/features/client-plans/components/AssignPlanDialog.tsx` | Cambiare la navigazione del bottone "Crea template" da `/library?tab=templates` a `/templates/new?mode=edit` |

## Dettaglio tecnico

Alla riga 95 del file, l'`onClick` del bottone verra modificato:

```tsx
// Prima
navigate("/library?tab=templates");

// Dopo
navigate("/templates/new?mode=edit");
```

Questo segue lo stesso pattern gia usato nella tab Templates della libreria (`TemplatesTab.tsx`).
