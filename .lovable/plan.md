
## Allineamento AppSidebar — Dark Signature + Accent Ice (v3 Final)

Piano v2 con i 2 micro-hardening integrati: token naming disambiguato e sidebar-muted calibrato per dark mode.

---

### 1. Token CSS — `src/styles/motion-tokens.css`

**`:root` — Sezione Sidebar** (linee 78-89):

| Token | Attuale | Nuovo |
|-------|---------|-------|
| `--sidebar-background` | `220 15% 8%` | `220 15% 6%` |
| `--sidebar-active` | `220 12% 14%` | `220 12% 18%` |
| `--sidebar-item-hover` | (non esiste) | `220 12% 16%` |
| `--sidebar-muted` | (non esiste) | `220 10% 65%` |

Gerarchia L*: background 6% < item-hover 16% < active 18%.

**`.dark` — Sezione Sidebar** (linee 160-171):

| Token | Attuale | Nuovo |
|-------|---------|-------|
| `--sidebar-background` | `220 15% 6%` | invariato |
| `--sidebar-active` | `220 12% 12%` | `220 12% 14%` |
| `--sidebar-item-hover` | (non esiste) | `220 12% 11%` |
| `--sidebar-muted` | (non esiste) | `220 10% 60%` |

Nota: `--sidebar-muted` in dark a 60% (non 65%) per evitare che il testo default sembri troppo "attivo" su sfondo scuro.

---

### 2. Tailwind config — `tailwind.config.ts`

Aggiungere nel blocco `sidebar` (linee 98-108):
- `"item-hover": "hsl(var(--sidebar-item-hover))"`
- `muted: "hsl(var(--sidebar-muted))"`

Nome `item-hover` invece di `hover` per evitare ambiguita' con la utility `hover:`.

---

### 3. tokens.ts — `src/design/tokens.ts`

Aggiungere nell'oggetto `sidebar`:
- `"sidebar-item-hover": "220 12% 16%"`
- `"sidebar-muted": "220 10% 65%"`

Aggiornare `"sidebar-background"` a `"220 15% 6%"` e `"sidebar-active"` a `"220 12% 18%"`.

---

### 4. AppSidebar.tsx — Solo classi

**Container aside** (linea 35):
- Da: `bg-muted`
- A: `bg-sidebar border-r border-sidebar-border text-sidebar-foreground`

**Logo "M" collapsed** (linea 46):
- Da: `text-primary`
- A: `text-sidebar-foreground`

**Logo "Motion" expanded** (linea 48):
- Aggiungere: `text-sidebar-foreground`

**Nav item focus-visible** (linea 75):
- Da: `focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:bg-foreground/14 focus-visible:text-foreground`
- A: `focus-visible:ring-2 focus-visible:ring-sidebar-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:text-sidebar-foreground`

**Nav item active** (linea 80):
- Da: `bg-primary/15 text-primary font-semibold hover:bg-primary/18`
- A: `bg-sidebar-active text-sidebar-foreground font-semibold hover:bg-sidebar-active`

**Nav item default** (linea 81):
- Da: `text-muted-foreground hover:bg-foreground/14 hover:text-foreground`
- A: `text-sidebar-muted hover:bg-sidebar-item-hover hover:text-sidebar-foreground`

**Indicator bar expanded** (linea 88):
- Da: `bg-primary/80`
- A: `bg-[hsl(var(--accent))]`

**Indicator bar collapsed** (linea 91):
- Da: `bg-primary/80`
- A: `bg-[hsl(var(--accent))]`

---

### Cose che NON cambiano

- Layout, width, sticky, transition, collapsed/expanded logic
- NAV_ITEMS, routing, Tooltip/TooltipPortal
- Padding, gap, border-radius
- Nessun file diverso da questi 4
