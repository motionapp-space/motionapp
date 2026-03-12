

# Open Terms & Privacy Links in New Tabs

All internal links to `/terms` and `/privacy` should open in a new browser tab so users never leave their current context.

## Changes

### 1. `src/pages/Settings.tsx` (lines 249-258)
Replace `<Link to=...>` with `<a href=... target="_blank" rel="noopener noreferrer">` for both buttons.

### 2. `src/pages/Terms.tsx` (lines 244-249)
Replace both footer `<Link>` with `<a href=... target="_blank" rel="noopener noreferrer">`.

### 3. `src/pages/Privacy.tsx` (lines 202-207)
Same — replace both footer `<Link>` with `<a href=... target="_blank" rel="noopener noreferrer">`.

### 4. `src/pages/Auth.tsx`
Already uses `target="_blank"` — no changes needed.

