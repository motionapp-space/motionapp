

# Dashboard Final Refinement — Contrast, Hierarchy, Brand Confidence

## Changes (6 files)

### 1. `motion-tokens.css` — Add `--accent-strong` token
- Light: `--accent-strong: 222 38% 52%;` (warmer, slightly desaturated vs pure 40% 55% — avoids feeling too cold)
- Dark: `--accent-strong: 222 38% 62%;`
- Added under the existing accent section in both `:root` and `.dark`

### 2. `tailwind.config.ts` — Register `accent.strong`
- Add `strong: "hsl(var(--accent-strong))"` inside the `accent` color group (line ~88)

### 3. `KpiStrip.tsx`
- Icon: `text-accent` → `text-accent-strong`

### 4. `TodayEventsCard.tsx` — Hero card refinements
- **Background**: `bg-[hsl(var(--foreground)/0.96)]` → `bg-gradient-to-b from-neutral-950 to-neutral-900`
- **Title**: `text-lg` → `text-xl`; add `mb-3 pb-3 border-b border-white/10` (subtle neutral divider, not accent)
- **NextEventBanner**: Only the "Prossimo evento" label gets `text-accent` — the rest of the line stays `text-primary-foreground/60`

### 5. `PendingActionsCard.tsx`
- Row hover: `hover:bg-muted/50` → `hover:bg-accent/10`
- Empty state: `py-5` → `py-4`

### 6. `ClientsLowSessionsCard.tsx` + `InactiveClientsCard.tsx`
- Row hover: `hover:bg-muted/50` → `hover:bg-accent/10`
- Empty state: `py-5` → `py-4`

## Token choice rationale
Using `222 38% 52%` (light) instead of `222 40% 55%` — slightly warmer and less saturated to avoid feeling too cold on white backgrounds per user's guidance to "soften if too saturated."

