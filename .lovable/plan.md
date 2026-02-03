

# Allineamento UI `PendingRequestCard`

Ristrutturazione completa della card per aderire alle specifiche del design system Motion, mantenendo la coerenza con la Brand Identity (colori primary, accent, destructive).

---

## Riepilogo Modifiche

### Struttura Attuale vs Nuova

```text
ATTUALE:
┌─────────────────────────────────────┐
│ [Header blu con badge]              │
├─────────────────────────────────────┤
│ 🟣 Nome Cliente                     │
│ 📅 giovedì 6 febbraio 2025          │
│ ⏰ 10:00 – 11:00 (60 min)           │
│ "Note..."                           │
│ [Approva] [...]                     │
└─────────────────────────────────────┘

NUOVA (da specifica):
┌─────────────────────────────────────┐
│ p-4 space-y-4                       │
│ ┌─────────────────────────────────┐ │
│ │ [Da approvare] lun 3 feb · 10:00│ │  ← Riga 1
│ │ 🟣 Mario Rossi                  │ │  ← Riga 2
│ │ Lezione singola · 60 min        │ │  ← Riga 3
│ │ "Note opzionali..."             │ │  ← Riga 4 (opz)
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [Approva] [Controproponi] [Rif] │ │  ← Azioni
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Dettaglio Implementazione

### 1. Rimozione Header Colorato

Eliminare il blocco header blu:
```tsx
// RIMUOVERE QUESTO:
<div className="bg-blue-50 dark:bg-blue-950/30 px-4 py-2 border-b ...">
  <Badge className="bg-blue-600 ...">DA APPROVARE</Badge>
</div>
```

### 2. Nuovo Layout Info (space-y-1)

**Riga 1: Badge + Data/Ora inline**
```tsx
<div className="flex items-center gap-2 flex-wrap">
  <Badge className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 pointer-events-none">
    Da approvare
  </Badge>
  <span className="text-sm text-muted-foreground">
    {formattedDateCompact}
  </span>
  <span className="text-sm font-semibold text-foreground">
    {formattedTimeRange}
  </span>
</div>
```

**Formato data compatto:**
```tsx
const formattedDateCompact = format(startDate, "EEE d MMM", { locale: it });
// Risultato: "lun 3 feb"

const formattedTimeRange = `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;
// Risultato: "10:00 – 11:00"
```

**Riga 2: Cliente con ColorDot**
```tsx
<div className="flex items-center gap-2">
  <ClientColorDot clientId={request.coach_client_id} />
  <span className="text-sm font-medium text-foreground truncate">
    {request.client_name}
  </span>
</div>
```

**Riga 3: Metadati**
```tsx
<p className="text-xs text-muted-foreground">
  Lezione singola · {durationMinutes} min
</p>
```

**Riga 4: Note (opzionale)**
```tsx
{request.notes && (
  <p className="text-xs italic text-muted-foreground line-clamp-1">
    "{request.notes}"
  </p>
)}
```

### 3. Nuovo Blocco Azioni (3 bottoni espliciti)

Sostituire DropdownMenu con bottoni espliciti + AlertDialog:

```tsx
<div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
  {/* Bottone Approva - Primary */}
  <Button
    onClick={() => onApprove(request.id)}
    disabled={isLoading}
    className="flex-1 sm:flex-none"
  >
    <Check className="h-4 w-4" />
    Approva
  </Button>

  {/* Bottone Controproponi - Outline */}
  <Button
    variant="outline"
    onClick={() => onCounterPropose(request)}
    disabled={isLoading}
    className="flex-1 sm:flex-none"
  >
    <ArrowLeftRight className="h-4 w-4" />
    Controproponi
  </Button>

  {/* Bottone Rifiuta - Ghost Destructive con AlertDialog */}
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button
        variant="ghost"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
        disabled={isLoading}
      >
        Rifiuta
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Rifiutare la richiesta?</AlertDialogTitle>
        <AlertDialogDescription>
          Questa azione non può essere annullata. Il cliente verrà notificato del rifiuto.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Annulla</AlertDialogCancel>
        <AlertDialogAction
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={() => onDecline(request.id)}
        >
          Rifiuta
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>
```

### 4. Aggiornamento Import

Aggiungere:
```tsx
import { ArrowLeftRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
```

Rimuovere:
```tsx
import { Calendar, Clock, MoreHorizontal, RefreshCw, X } from "lucide-react";
import { DropdownMenu, ... } from "@/components/ui/dropdown-menu";
```

---

## Confronto Visivo Finale

| Elemento | Prima | Dopo |
|----------|-------|------|
| **Badge** | Blu pieno `bg-blue-600` | Brand `bg-primary/10 text-primary` |
| **Header** | Box colorato separato | Inline con contenuto |
| **Data** | "giovedì 6 febbraio 2025" | "lun 3 feb" (compatto) |
| **Icone info** | Calendar + Clock | Nessuna icona |
| **Metadati** | Solo durata tra parentesi | "Lezione singola · 60 min" |
| **Note** | `line-clamp-2` con background | `line-clamp-1` italic senza bg |
| **Azioni** | 1 button + dropdown | 3 bottoni espliciti |
| **Rifiuta** | Nel dropdown | AlertDialog di conferma |
| **Responsive** | Non adattivo | Mobile: stack, Desktop: row |

---

## File Modificati

| File | Modifica |
|------|----------|
| `src/features/bookings/components/PendingRequestCard.tsx` | Ristrutturazione completa |

