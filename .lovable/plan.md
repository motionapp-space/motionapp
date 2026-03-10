
# TodayEventsCard — Switch to explicit background

The `bg-accent/xx` approach doesn't work because the accent HSL token at low opacity on a near-white background is imperceptible. Time to use a real, opaque color.

## Approach

Since the design system doesn't have a `sky` token, use Tailwind's built-in `bg-sky-50` and `border-sky-100` directly. These are opaque pastels that will be immediately visible. The rows inside should be lighter than the container (white/semi-transparent white).

## Changes — `TodayEventsCard.tsx`

**Container (line 56)**:
- `bg-accent/14 border border-accent/30` → `bg-sky-50 border border-sky-100`

**Event rows (lines 16-18)** — rows must be lighter than container:
- Next event: `bg-white/80 ring-1 ring-sky-200 hover:bg-white/90`
- Normal: `bg-white/60 hover:bg-white/80`

**Separator (line 88)**: `border-border` → `border-sky-100` to harmonize

**CTA (line 91)**: keep `text-accent-strong` — already correct.

Single file, 3 edits.
