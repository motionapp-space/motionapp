

## Fix: Hover del pulsante "Indietro" nella Topbar

### Problema
Il pulsante freccia indietro nella Topbar usa `hover:bg-muted` (grigio chiaro), mentre tutte le altre icone (notifiche, utente, legenda) usano il variant `ghost` standard che applica `hover:bg-accent hover:text-accent-foreground` (Ice Neutral + bianco).

Il pulsante ha anche `border border-border` e dimensioni ridotte (`h-8 w-8`) che lo rendono visivamente diverso dagli altri.

### Soluzione
Modificare il className del pulsante indietro in `src/components/Topbar.tsx` per allinearsi al comportamento hover delle altre icone, rimuovendo l'override `hover:bg-muted` e il bordo, e usando il variant `ghost` + size `icon` standard.

### Dettagli tecnici

**File: `src/components/Topbar.tsx`** (riga 35-42)

Da:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={onBack}
  className="shrink-0 h-8 w-8 border border-border hover:bg-muted"
>
```

A:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={onBack}
  className="shrink-0"
>
```

Questo allinea il pulsante indietro alle stesse regole di hover (accent + bianco) usate da NotificationBell, UserMenu e il pulsante legenda, mantenendo la dimensione standard `icon` (44x44px) coerente con il design system Motion.

