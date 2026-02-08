
## Correggere la trasparenza dei Toast

### Problema
I toast appaiono trasparenti perché le classi CSS per i tipi specifici (success, error, info, warning) usano sfondi con opacità molto bassa (10-20%), che sovrascrivono lo sfondo solido `bg-card` definito per il toast base.

### Soluzione
Modificare gli stili dei toast per mantenere uno sfondo opaco con solo un leggero tinting colorato, garantendo leggibilità e coerenza visiva.

### Modifiche da effettuare

**File: `src/components/ui/sonner.tsx`**

Aggiornare le classi CSS per ogni tipo di toast:

| Tipo | Attuale | Nuovo |
|------|---------|-------|
| success | `bg-accent/10` | `bg-card` (mantiene solo il bordo colorato) |
| error | `bg-destructive/10` | `bg-card` |
| info | `bg-primary/10` | `bg-card` |
| warning | `bg-amber-50 dark:bg-amber-950/20` | `bg-card` |

Ogni toast manterrà:
- Lo sfondo solido `bg-card` per la leggibilità
- Il bordo laterale colorato (`border-l-4`) per differenziare visivamente i tipi
- L'ombra esistente (`shadow-lg`) per la profondità

### Dettagli tecnici
```typescript
// Nuovo oggetto classNames
success: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-accent group-[.toaster]:bg-card",
error: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-destructive group-[.toaster]:bg-card",
info: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary group-[.toaster]:bg-card",
warning: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-amber-500 group-[.toaster]:bg-card",
```

### Risultato
I toast avranno uno sfondo opaco e solido, con il bordo colorato laterale che indica il tipo di notifica (successo, errore, info, warning).
