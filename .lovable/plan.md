

# Scroll Affordance Neutro + Ripristino Bottoni Standard

## Obiettivo

1. Rendere la scroll affordance **neutra** (gradient grigio `from-foreground/6`, senza blur, senza colore primary)
2. **Full-width** sopra tutto il footer (invite bar + CTA), posizionata tramite wrapper `relative`
3. **Ripristinare i bottoni standard size** nelle 3 modali "Nuovo cliente" (rimuovere `size="sm"` e `h-9 px-4`)
4. Applicare lo stesso pattern a tutte le modali con body scroll + sticky footer

---

## File da modificare

| File | Tipo modifica |
|------|---------------|
| `src/components/ui/scroll-affordance.tsx` | Aggiornare gradient e posizionamento |
| `src/pages/Clients.tsx` | 3 occorrenze: ripristinare bottoni standard |
| `src/features/packages/components/PackageDialog.tsx` | Aggiungere ScrollAffordance |
| `src/features/events/components/ClientAppointmentModal.tsx` | Aggiungere ScrollAffordance |
| `src/features/client-bookings/components/SlotSelectorSheet.tsx` | Aggiungere ScrollAffordance |

**Nota**: `EventEditorModal.tsx` non necessita di modifica - usa una struttura diversa con DialogFooter separato e non ha un body scrollabile centrale con sticky footer.

---

## Modifiche dettagliate

### 1. `src/components/ui/scroll-affordance.tsx`

**Stato attuale (righe 76-77):**
```tsx
placement === "top" && "bottom-full h-6 bg-gradient-to-t from-primary/10 to-transparent blur-[0.5px]",
placement === "bottom" && "top-full h-6 bg-gradient-to-b from-primary/10 to-transparent blur-[0.5px]",
```

**Nuovo codice:**
```tsx
placement === "top" && "inset-x-0 top-0 h-8 bg-gradient-to-b from-foreground/6 to-transparent",
placement === "bottom" && "inset-x-0 bottom-0 h-8 bg-gradient-to-t from-foreground/6 to-transparent",
```

**Cambiamenti:**
- `from-primary/10` diventa `from-foreground/6` (grigio neutro, molto leggero)
- Rimuovere `blur-[0.5px]` (look piu pulito)
- Fix orientamento: `placement="top"` usa `to-b` (gradient che scende), `placement="bottom"` usa `to-t` (gradient che sale)
- `inset-x-0` per full-width
- `h-6` diventa `h-8` per maggiore visibilita
- Rimuovere `bottom-full` / `top-full` - l'offset viene gestito dal chiamante tramite className

---

### 2. `src/pages/Clients.tsx` - 3 modali "Nuovo cliente"

Le 3 occorrenze sono alle righe:
- ~458-497 (onboarding)
- ~1032-1073 (first client)  
- ~1634-1675 (active user)

**Per ciascuna occorrenza:**

#### A. Aggiungere offset sulla ScrollAffordance

Attuale:
```tsx
<div className="relative shrink-0">
  <ScrollAffordance targetRef={modalScrollRef} placement="top" />
```

Nuovo:
```tsx
<div className="relative shrink-0">
  <ScrollAffordance 
    targetRef={modalScrollRef} 
    placement="top" 
    className="absolute -top-8 left-0 right-0"
  />
```

#### B. Ripristinare bottoni standard size

**Attuale (riga ~483-496):**
```tsx
<div className="flex justify-end gap-2 pt-3 pb-1">
  <Button variant="outline" size="sm" className="h-9 px-4" onClick={...}>
    {toSentenceCase("Annulla")}
  </Button>
  <Button size="sm" className="h-9 px-4" onClick={handleCreateClient} disabled={...}>
```

**Nuovo:**
```tsx
<div className="flex justify-end gap-3 pt-3 pb-3">
  <Button variant="outline" onClick={...}>
    {toSentenceCase("Annulla")}
  </Button>
  <Button onClick={handleCreateClient} disabled={...}>
```

**Rimuovere:**
- `size="sm"` 
- `className="h-9 px-4"`
- `gap-2` diventa `gap-3`
- `pb-1` diventa `pb-3`

---

### 3. `src/features/packages/components/PackageDialog.tsx`

Questa modale ha un body scrollabile e un DialogFooter sticky.

**Modifiche:**
1. Aggiungere import: `import { ScrollAffordance } from "@/components/ui/scroll-affordance";`
2. Aggiungere ref: `const scrollRef = useRef<HTMLDivElement>(null);`
3. Applicare ref al container scrollabile (riga ~163): `ref={scrollRef}`
4. Wrappare DialogFooter in un container relative con ScrollAffordance

**Attuale (righe ~306-317):**
```tsx
<DialogFooter className="shrink-0 pt-4 border-t mt-4">
  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
    Annulla
  </Button>
  <Button type="submit" disabled={isLoading}>
    {isLoading ? "Creazione..." : "Crea pacchetto"}
  </Button>
</DialogFooter>
```

**Nuovo:**
```tsx
<div className="relative shrink-0">
  <ScrollAffordance 
    targetRef={scrollRef} 
    placement="top" 
    className="absolute -top-8 left-0 right-0"
  />
  <DialogFooter className="pt-4 border-t mt-4">
    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
      Annulla
    </Button>
    <Button type="submit" disabled={isLoading}>
      {isLoading ? "Creazione..." : "Crea pacchetto"}
    </Button>
  </DialogFooter>
</div>
```

---

### 4. `src/features/events/components/ClientAppointmentModal.tsx`

Ha un body scrollabile (riga 162: `flex-1 overflow-y-auto`) e footer sticky (righe 209-219).

**Modifiche:**
1. Aggiungere import: `import { ScrollAffordance } from "@/components/ui/scroll-affordance";`
2. Aggiungere: `const scrollRef = useRef<HTMLDivElement>(null);`
3. Applicare ref: `<div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4">`
4. Wrappare footer:

**Attuale (righe 209-219):**
```tsx
<div className="flex justify-end gap-2 pt-4 border-t">
  <Button variant="outline" onClick={() => onOpenChange(false)}>
    Annulla
  </Button>
  <Button ...>
    Conferma prenotazione
  </Button>
</div>
```

**Nuovo:**
```tsx
<div className="relative shrink-0">
  <ScrollAffordance 
    targetRef={scrollRef} 
    placement="top" 
    className="absolute -top-8 left-0 right-0"
  />
  <div className="flex justify-end gap-3 pt-4 pb-3 border-t">
    <Button variant="outline" onClick={() => onOpenChange(false)}>
      Annulla
    </Button>
    <Button ...>
      Conferma prenotazione
    </Button>
  </div>
</div>
```

---

### 5. `src/features/client-bookings/components/SlotSelectorSheet.tsx`

Ha 2 step, ciascuno con body scrollabile e sticky footer.

**Step 1 (riga ~186-290):**
- Body scrollabile: `<div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">`
- Footer: righe 282-290

**Step 2 (riga ~314-345):**
- Body scrollabile: `<div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6">`
- Footer: righe 348-377

**Modifiche:**
1. Aggiungere import: `import { ScrollAffordance } from "@/components/ui/scroll-affordance";`
2. Aggiungere 2 ref: `const scrollRefStep1 = useRef<HTMLDivElement>(null);` e `const scrollRefStep2 = useRef<HTMLDivElement>(null);`
3. Applicare ref a ciascun body scrollabile
4. Wrappare ciascun footer:

**Step 1 footer - Attuale (righe 282-290):**
```tsx
<div className="sticky bottom-0 px-4 pt-3 bg-background border-t flex-shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
  <Button ...>
```

**Nuovo:**
```tsx
<div className="sticky bottom-0 bg-background flex-shrink-0 relative">
  <ScrollAffordance 
    targetRef={scrollRefStep1} 
    placement="top" 
    className="absolute -top-8 left-0 right-0"
  />
  <div className="px-4 pt-3 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
    <Button ...>
  </div>
</div>
```

Applicare lo stesso pattern al footer dello Step 2.

---

## Riepilogo visivo della struttura

```text
DialogContent / SheetContent
├── Header (shrink-0)
├── Body scrollabile (flex-1 overflow-y-auto) ← targetRef
└── Footer wrapper (shrink-0 relative)
    ├── ScrollAffordance (absolute -top-8 inset-x-0) ← gradient neutro
    └── Footer content (invite bar + bottoni)
```

---

## Specifiche tecniche finali ScrollAffordance

| Proprieta | Valore |
|-----------|--------|
| Gradient | `from-foreground/6 to-transparent` |
| Altezza | `h-8` (32px) |
| Direzione | `to-b` per placement="top", `to-t` per placement="bottom" |
| Blur | Nessuno |
| Posizione | `absolute` + offset gestito dal chiamante |
| Larghezza | `inset-x-0` (full-width) |
| Z-index | `z-10` |

---

## Acceptance Criteria

1. Scroll affordance visibile solo quando contenuto scrollabile E non sei in fondo
2. Gradient grigio neutro `foreground/6`, niente primary color
3. Nessun blur
4. Full-width sopra tutto il footer
5. Bottoni modali "Nuovo cliente" a dimensione standard (no `size="sm"`, no `h-9`)
6. Pattern applicato a: Clients.tsx, PackageDialog, ClientAppointmentModal, SlotSelectorSheet

