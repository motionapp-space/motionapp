

# TodayEventsCard — Ice Accent Surface

## Problem
`bg-accent/14` uses the accent token (`hsl(222 35% 68%)`) at 14% opacity over a 98% lightness background. The result is mathematically ~96.8% lightness — indistinguishable from the 98% background. No amount of opacity tweaking will fix this with a 68%-lightness base color.

## Solution
Add two opaque "accent surface" tokens to the design system — a pre-mixed ice-blue tint that is genuinely visible. Then use them in the card.

### New tokens in `motion-tokens.css`

**Light mode:**
- `--accent-surface: 222 30% 94%` — visible pale ice blue
- `--accent-surface-border: 222 28% 88%` — subtle but real border

**Dark mode:**
- `--accent-surface: 222 25% 18%` — dark ice tint
- `--accent-surface-border: 222 25% 25%`

### New Tailwind colors in `tailwind.config.ts`
```
"accent-surface": "hsl(var(--accent-surface))"
"accent-surface-border": "hsl(var(--accent-surface-border))"
```

### TodayEventsCard.tsx changes

**Container** (line 56):
`bg-accent-surface border border-accent-surface-border`

**Event rows** — must be lighter than container:
- Next: `bg-white/70 ring-1 ring-accent-surface-border`
- Normal: `bg-white/50 hover:bg-white/70`

**Separator** (line 88): `border-accent-surface-border`

**Text**: all stays `text-foreground` / `text-muted-foreground` — fully accessible on a 94% lightness surface.

4 files touched, design-system-native approach.

