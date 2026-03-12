

# Privacy Policy Page

## What to build
A `/privacy` page that mirrors the existing `Terms.tsx` in structure, layout, and styling — rendering 11 policy sections statically.

## Changes

### 1. Create `src/pages/Privacy.tsx`
Clone the exact pattern from `Terms.tsx`:
- `<main>` → `<article>` → `<header>` + 11 `<section>` blocks + `<footer>`
- Same layout tokens: `max-w-3xl mx-auto px-6 py-24`, `space-y-10` page, `space-y-3` inner sections, `space-y-2` header
- Same typography: `h1` title "Privacy Policy", `text-sm text-muted-foreground` for date, `h2` for sections, body in `text-muted-foreground`
- Section 2 has two sub-groups with inline bold labels ("Information provided by professionals" / "Client information") rendered as `<p>` with `font-medium text-foreground` before their respective lists
- Footer links: "Privacy Policy" → `/privacy`, "Terms" → `/terms` — same `<footer>` pattern as Terms page

### 2. Update `src/App.tsx`
- Import `Privacy` from `src/pages/Privacy`
- Add `<Route path="/privacy" element={<Privacy />} />` next to the `/terms` route in the public routes block

No new dependencies, colors, or components.

