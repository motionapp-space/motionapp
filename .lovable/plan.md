

# Piano: Scala Tipografica "Navbar-First" (Safe + Motion-Level)

## Riepilogo Modifiche

| File | Modifica | Dettagli |
|------|----------|----------|
| `card.tsx` | CardTitle | `text-2xl` → `text-base font-semibold leading-6` (no tracking-tight) |
| `empty-state.tsx` | Icona | `h-20 w-20 p-6` → `h-12 w-12 p-4` |
| `empty-state.tsx` | Titolo | `text-lg` → `text-base font-semibold leading-6` |
| `empty-state.tsx` | Descrizione | Aggiungere `leading-5` |
| `tab-header.tsx` | Title | Aggiungere `leading-6` |
| `tab-header.tsx` | Subtitle | Aggiungere `font-medium leading-5` |

---

## Modifiche per File

### 1. `src/components/ui/card.tsx`

**Linea 19** - CardTitle con line-height corretto e senza tracking-tight:

```typescript
<h3 ref={ref} className={cn("text-base font-semibold leading-6", className)} {...props} />
```

### 2. `src/components/ui/empty-state.tsx`

**Linee 19-27** - Icona ridotta + titolo/descrizione con line-height:

```typescript
<div className="rounded-full bg-muted p-4">
  <Icon className="h-12 w-12 text-muted-foreground" />
</div>

<div className="space-y-2">
  <h3 className="text-base font-semibold leading-6">{title}</h3>
  {description && (
    <p className="text-sm text-muted-foreground leading-5 max-w-md">
      {description}
    </p>
  )}
```

### 3. `src/components/ui/tab-header.tsx`

**Linee 14-18** - Title e subtitle con line-height:

```typescript
<h2 className="text-lg font-semibold leading-6" data-testid="tab-header-title">
  {title}
</h2>
<p className="text-sm font-medium text-muted-foreground mt-1 leading-5" data-testid="tab-header-subtitle">
  {subtitle}
</p>
```

---

## Scala Tipografica Risultante

| Livello | Tailwind | Pixel | Line-Height |
|---------|----------|-------|-------------|
| H1 | `text-lg font-semibold leading-6` | 18px | 24px |
| H2 | `text-sm font-medium text-muted-foreground leading-5` | 14px | 20px |
| H3 | `text-base font-semibold leading-6` | 16px | 24px |
| Body | `text-sm leading-5` | 14px | 20px |
| Caption | `text-[13px] leading-5 text-muted-foreground` | 13px | 20px |
| Label | `text-xs font-medium` | 12px | 16px |

---

## Note Motion-Level

- **tracking-tight rimosso**: su 16px in italiano poteva risultare troppo compresso
- **leading-6 per titoli**: garantisce aria e leggibilità
- **leading-5 per body/subtitle**: mantiene compattezza senza sacrificare leggibilità
- **CardTitle small**: dove serve H3 a 14px si usa `className="text-sm"` localmente

