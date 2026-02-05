
# Fix: Aumentare dimensione testo microcopy nella tab Sessioni

## Problema
Il testo educativo nella tab Sessioni ("Le sessioni di allenamento si registrano...") usa `text-xs` (12px), risultando leggermente piccolo.

## Soluzione
Aumentare la dimensione da 12px a 13px, coerente con la scala tipografica del design system (13px = microcopy/caption).

## Modifica tecnica

**File:** `src/features/sessions/components/SessionHistoryTab.tsx`

**Riga 136 - Da:**
```tsx
<div className="text-xs text-foreground/80 bg-muted/50 rounded-lg px-4 py-3 space-y-1">
```

**A:**
```tsx
<div className="text-[13px] text-foreground/80 bg-muted/50 rounded-lg px-4 py-3 space-y-1">
```

## Risultato
Il testo passerà da 12px a 13px, migliorando la leggibilità mantenendo il ruolo di microcopy secondario.
