
# Fix: Toast Trasparenti - Allineamento alla Brand ID

## Problema Identificato

I toast di conferma/errore (Sonner) appaiono trasparenti perché usano sfondi con opacità 5%:
- `success`: `bg-accent/5` (verde al 5% → invisibile)
- `error`: `bg-destructive/5` (rosso al 5% → invisibile)  
- `info`: `bg-primary/5` (blu al 5% → invisibile)

Con uno sfondo quasi bianco (`--background: 0 0% 99%`), queste opacità creano un toast "fantasma".

---

## Soluzione

Aumentare l'opacità dello sfondo mantenendo uno stile leggero e coerente con la Brand ID:
- Sfondo: da 5% a 10-15% (visibile ma non invadente)
- Border-left: manteniamo come accento colorato
- Shadow: usiamo `shadow-lg` per più presenza
- Padding e spacing coerenti con il design system

### Stili proposti (Sonner)

| Variante | Prima | Dopo |
|----------|-------|------|
| Base toast | `bg-card border-border shadow-md` | `bg-card border-border shadow-lg` |
| Success | `bg-accent/5` | `bg-accent/10` |
| Error | `bg-destructive/5` | `bg-destructive/10` |
| Info | `bg-primary/5` | `bg-primary/10` |
| Warning | `bg-amber-50` | `bg-amber-50` (OK) |

---

## File da Modificare

### 1. src/components/ui/sonner.tsx

Aggiornare le classi CSS nel `toastOptions.classNames`:

```typescript
toastOptions={{
  classNames: {
    toast:
      "group toast group-[.toaster]:font-sans group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-md",
    description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
    actionButton:
      "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-sm group-[.toast]:font-medium",
    cancelButton:
      "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-sm",
    success:
      "group-[.toaster]:border-l-4 group-[.toaster]:border-l-accent group-[.toaster]:bg-accent/10",
    error:
      "group-[.toaster]:border-l-4 group-[.toaster]:border-l-destructive group-[.toaster]:bg-destructive/10",
    info:
      "group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary group-[.toaster]:bg-primary/10",
    warning:
      "group-[.toaster]:border-l-4 group-[.toaster]:border-l-amber-500 group-[.toaster]:bg-amber-50 dark:group-[.toaster]:bg-amber-950/20",
  },
}}
```

### 2. src/components/ui/toast.tsx (Radix Toast)

Verificare e allineare gli stili delle varianti per coerenza:
- Aggiungere `shadow-lg` per consistenza con Sonner
- Verificare che `bg-background` sia sufficiente (è solido, quindi OK)

---

## Risultato Atteso

| Stato | Prima | Dopo |
|-------|-------|------|
| Toast success | Quasi invisibile (5% opacità) | Sfondo verde leggero ma visibile (10%) |
| Toast error | Quasi invisibile | Sfondo rosso leggero ma visibile |
| Toast info | Quasi invisibile | Sfondo blu leggero ma visibile |
| Shadow | `shadow-md` (debole) | `shadow-lg` (più presente) |

Il toast rimarrà leggero e coerente con la Brand ID (minimalista), ma sarà chiaramente visibile.

---

## Note Tecniche

- Il progetto usa **due sistemi toast**:
  - **Sonner**: per `toast.success()`, `toast.info()`, `toast.error()` - usato nella creazione eventi
  - **Radix Toast**: per `toast({ title, description })` da `use-toast` - usato negli update

- Entrambi sono renderizzati in `App.tsx` (righe 119-120)
- La modifica principale è su Sonner, Radix Toast usa già sfondi solidi
