

# Allineamento UI `CounterProposeDialog` — Design System Motion

Ristrutturazione completa della modale per aderire alle specifiche UI/UX mantenendo coerenza con la palette colori Motion.

---

## Riepilogo Modifiche Strutturali

### Layout Attuale vs Target

```text
ATTUALE (max-w-md):
┌─────────────────────────────────────┐
│ Header bg-muted/50                  │
├─────────────────────────────────────┤
│ Fast Path: bg-primary/5             │
├─────────────────────────────────────┤
│ Power Path: grid-cols-2             │
├─────────────────────────────────────┤
│ Footer                              │
└─────────────────────────────────────┘

TARGET (max-w-[720px], responsive):
┌─────────────────────────────────────────────────────────────┐
│ HEADER px-6 py-4 (titolo + sottotitolo | badge)            │
├─────────────────────────────────────────────────────────────┤
│ FAST PATH: grid 1→2 cols, rounded-xl, CheckCircle2 icon   │
├─────────────────────────────────────────────────────────────┤
│ DIVIDER (border-b)                                          │
├─────────────────────────────────────────────────────────────┤
│ POWER PATH: rounded-xl bg-muted/20                          │
│  ┌──────────────┬─────────────────────────────────────────┐ │
│  │  Calendar    │  TimePicker + Quick Chips               │ │
│  │              │  + Availability Status (min-h-[72px])   │ │
│  └──────────────┴─────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ FOOTER: proposta preview + CTA h-11                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. DialogContent — Container Principale

**Attuale:**
```tsx
className="max-w-md max-h-[90vh] p-0 gap-0 grid grid-rows-[auto_1fr_auto] overflow-hidden"
```

**Target:**
```tsx
className="max-w-[720px] w-[calc(100vw-32px)] max-h-[85vh] p-0 gap-0 
           grid grid-rows-[auto_1fr_auto] overflow-hidden"
```

| Proprietà | Valore | Scopo |
|-----------|--------|-------|
| `max-w-[720px]` | 720px | Larghezza massima desktop |
| `w-[calc(100vw-32px)]` | viewport - 32px | Margini 16px su mobile |
| `max-h-[85vh]` | 85% viewport | Evita overflow verticale |

---

## 2. Header — Layout Flex con Badge

**Attuale:**
```tsx
<div className="bg-muted/50 border-b px-4 py-3">
  <DialogHeader className="space-y-1">
    <DialogTitle>Proponi nuovo orario</DialogTitle>
    <div>Richiesta originale: <Badge>...</Badge></div>
  </DialogHeader>
</div>
```

**Target:**
```tsx
<div className="shrink-0 border-b bg-background px-6 py-4">
  <div className="flex items-end justify-between gap-4">
    {/* Left: Titolo + Sottotitolo */}
    <div className="space-y-1">
      <DialogTitle className="text-lg font-semibold">
        Proponi un nuovo orario
      </DialogTitle>
      <p className="text-sm text-muted-foreground">
        Il cliente potrà accettare o rifiutare la proposta.
      </p>
    </div>
    {/* Right: Badge originale */}
    <Badge variant="outline" className="px-3 py-1 rounded-full text-sm font-normal whitespace-nowrap shrink-0">
      {format(originalStart, "EEE d MMM", { locale: it })} · {format(originalStart, "HH:mm")}–{format(originalEnd, "HH:mm")}
    </Badge>
  </div>
</div>
```

---

## 3. Fast Path — Slot Suggeriti

**Modifiche chiave:**

| Elemento | Attuale | Target |
|----------|---------|--------|
| Container | `px-4 py-3 border-b bg-primary/5` | `px-6 py-5` (no background colorato) |
| Titolo | `Sparkles icon + text-primary` | Semplice testo `text-sm font-medium` |
| Sottotitolo | Assente | `text-xs text-muted-foreground` |
| Grid | `grid-cols-2 gap-2` | `grid-cols-1 sm:grid-cols-2 gap-3` |
| Slot button | `rounded-lg p-2` | `rounded-xl px-4 py-3` |
| Check icon | `Check h-3 w-3` inline | `CheckCircle2 h-4 w-4 absolute top-2 right-2` |

**Target JSX:**
```tsx
<div className="px-6 py-5">
  <div className="mb-3">
    <h3 className="text-sm font-medium text-foreground">Orari suggeriti</h3>
    <p className="text-xs text-muted-foreground">
      Suggeriti in base alla tua agenda e alla richiesta del cliente.
    </p>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {suggestedSlots.map((slot, idx) => (
      <button
        key={idx}
        onClick={() => handleSuggestedSlotClick(slot)}
        className={cn(
          "relative rounded-xl border bg-background px-4 py-3 text-left transition-all",
          "hover:bg-muted/40",
          isSlotSelected(slot)
            ? "border-primary bg-primary/5"
            : "border-border"
        )}
      >
        <span className="text-sm text-muted-foreground capitalize">
          {formatSlotDate(slot)}
        </span>
        <span className="block text-base font-semibold text-foreground">
          {formatSlotTime(slot)}
        </span>
        {isSlotSelected(slot) && (
          <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
        )}
      </button>
    ))}
  </div>
</div>
```

---

## 4. Divider

Aggiungere separatore tra Fast e Power path:

```tsx
<div className="border-b" />
```

---

## 5. Power Path — Selezione Manuale

### 5.1 Container

**Attuale:** `px-4 py-3`
**Target:**
```tsx
<div className="px-6 py-5">
  <div className="mb-3">
    <h3 className="text-sm font-medium text-foreground">Scegli data e ora</h3>
    <p className="text-xs text-muted-foreground">
      Seleziona manualmente una data e un orario.
    </p>
  </div>
  <div className="rounded-xl border bg-muted/20 p-4">
    {/* Calendar + Time section */}
  </div>
</div>
```

### 5.2 Layout Responsive Calendar + Time

**Target:**
```tsx
<div className="flex flex-col sm:flex-row gap-6">
  {/* Calendar - inline, non in popover */}
  <div className="shrink-0">
    <CalendarComponent
      mode="single"
      selected={manualDate}
      onSelect={handleManualDateChange}
      disabled={(date) => date < startOfDay(new Date())}
      className="rounded-md border bg-background"
      locale={it}
    />
  </div>
  
  {/* Right side: TimePicker + Quick chips + Status */}
  <div className="flex-1 space-y-4">
    {/* TimePicker */}
    <TimePicker ... />
    
    {/* Quick Time Chips */}
    <div className="flex flex-wrap gap-2">
      {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((time) => (
        <button
          key={time}
          onClick={() => handleManualTimeChange(time)}
          className={cn(
            "px-3 py-1.5 rounded-full border text-sm font-medium transition-all",
            manualTime === time
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:bg-muted"
          )}
        >
          {time}
        </button>
      ))}
    </div>
    
    {/* Availability Status - Fixed Height */}
    <div className="min-h-[72px]">
      {/* Status content */}
    </div>
  </div>
</div>
```

### 5.3 Availability Status — Colori Semantici

**Loading:**
```tsx
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <Loader2 className="h-4 w-4 animate-spin" />
  Verifico disponibilità...
</div>
```

**Available (emerald per success):**
```tsx
<div className="flex items-center gap-2 text-sm text-emerald-600">
  <CheckCircle2 className="h-4 w-4" />
  Disponibile
</div>
```

**Conflict (rose per warning):**
```tsx
<div className="space-y-3">
  <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/50 p-3">
    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
    <div className="text-sm text-rose-700">
      In conflitto con "{conflictEvent?.title}" ({formatEventTime})
    </div>
  </div>
  {/* Alternative chips */}
  <div className="flex flex-wrap gap-2">
    {alternativeSlots.map((slot, idx) => (
      <button
        key={idx}
        onClick={() => handleSuggestedSlotClick(slot)}
        className="px-3 py-1.5 rounded-full border border-border bg-background 
                   text-sm font-medium hover:bg-muted transition-all"
      >
        {formatSlotDate(slot)} · {formatSlotTime(slot)}
      </button>
    ))}
  </div>
</div>
```

---

## 6. TimePicker — Aggiornamenti Styling

**Attuale:**
```tsx
className="w-[180px] p-0"
// Option selected: "bg-accent"
```

**Target:**
```tsx
className="w-[160px] p-0 z-[100]"
// Option selected: "bg-primary text-primary-foreground hover:bg-primary/90"
// Option default: "hover:bg-muted text-foreground"
```

---

## 7. Footer — Preview + CTA

**Attuale:**
```tsx
<div className="border-t bg-background p-4">
  {activeProposal ? (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-green-600" />
        Proposta pronta per l'invio
      </div>
      <Button onClick={handleSubmit} className="w-full" size="lg">
        Proponi · {formatSlotDate(activeProposal)} · {formatSlotTime(activeProposal)}
      </Button>
    </div>
  ) : (
    <Button disabled className="w-full" size="lg">
      Seleziona un orario
    </Button>
  )}
</div>
```

**Target:**
```tsx
<div className="shrink-0 border-t bg-background px-6 py-4 space-y-3">
  {activeProposal ? (
    <>
      {/* Preview proposta */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">Nuova proposta:</span>
        <Badge variant="outline" className="px-2 py-0.5 rounded-full font-medium capitalize">
          {formatSlotDate(activeProposal)} · {formatSlotTime(activeProposal)}
        </Badge>
      </div>
      {/* CTA */}
      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting}
        className="w-full h-11"
      >
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Invio in corso...</>
        ) : (
          "Invia controproposta"
        )}
      </Button>
    </>
  ) : (
    <>
      <Button disabled className="w-full h-11">
        Invia controproposta
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Seleziona un orario suggerito oppure scegli data e ora.
      </p>
    </>
  )}
</div>
```

---

## 8. Import Aggiuntivi

```tsx
import { CheckCircle2, AlertCircle } from "lucide-react";
```

Rimuovere `Sparkles` (non più usato).

---

## Riepilogo Token Colori Brand

| Elemento | Token CSS | Uso |
|----------|-----------|-----|
| Background modale | `bg-background` | `hsl(0 0% 99%)` |
| Testo primario | `text-foreground` | `hsl(220 15% 20%)` |
| Testo secondario | `text-muted-foreground` | `hsl(220 9% 46%)` |
| Bordi | `border-border` | `hsl(220 15% 90%)` |
| Primary (selezione) | `border-primary bg-primary/5` | `hsl(220 70% 45%)` |
| CTA | `bg-primary text-primary-foreground` | Brand blu + bianco |
| Success | `text-emerald-600` | Semantico |
| Conflict | `border-rose-200 bg-rose-50/50 text-rose-700` | Semantico |

---

## File da Modificare

| File | Modifica |
|------|----------|
| `src/features/bookings/components/CounterProposeDialog.tsx` | Ristrutturazione completa UI |
| `src/components/ui/time-picker.tsx` | Styling opzioni (bg-primary per selected) |

