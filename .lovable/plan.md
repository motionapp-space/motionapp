

# Dashboard Final Polish — 3 Fixes

## Fix 1 — TodayEventsCard accent visibility

The accent token is `222 35% 68%` (medium blue). At `/6` opacity on a `98%` lightness background, it computes to roughly `rgba(131, 149, 189, 0.06)` — nearly invisible.

Tailwind's `/` opacity modifiers with HSL CSS vars work correctly, the token is just too light at low opacities.

**Solution**: Use `--accent-strong` (`222 38% 52%`) which is darker and produces visible tinting even at low opacity. Apply via inline style or a small utility, since Tailwind can't target arbitrary CSS vars with opacity shorthand easily.

Simpler approach: bump to `bg-accent/10 border-accent/25`. At 10% of `hsl(222 35% 68%)` the tint becomes perceptible. The border at 25% gives enough contrast.

**File**: `TodayEventsCard.tsx` line 57
- `bg-accent/6 border border-accent/18` → `bg-accent/10 border border-accent/25`

Also fix the duplicate `className` issue in EventRow (lines 15-16 have two conflicting flex declarations in `cn()`). Clean up to single coherent class string.

## Fix 2 — UpcomingEventsCard row layout

The `w-[100px]` on the day+time span (line 56) is too narrow for labels like "Domani · 06:30" causing a line break.

**File**: `UpcomingEventsCard.tsx` line 56
- `w-[100px]` → `w-[120px]` and add `whitespace-nowrap`

## Fix 3 — Period selector active state

Current active: `bg-card text-foreground shadow-sm` — card background on muted background, only differentiated by subtle shadow.

**File**: `ActivityTrendCard.tsx` lines 105-109
- Active state: `bg-card text-foreground shadow-sm border border-border` (add border for clear delineation)
- Inactive: unchanged

---

3 files, 4 small edits. No layout or data changes.

