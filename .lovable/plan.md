

# Terms of Service Page — Refined Plan

## Overview
Create a static, semantic, accessible Terms of Service page at `/terms` and register it as a public route.

## 1. Create `src/pages/Terms.tsx`

**Structure**: `<main>` → `<article>` → 13 `<section>` blocks.

**Layout**:
- Outer: `max-w-3xl mx-auto px-6 py-24`
- Page-level spacing: `space-y-10`
- Inner section spacing: `space-y-3`

**Typography** (existing Tailwind tokens only):
- `h1`: `text-3xl md:text-4xl font-semibold` — "Terms and Conditions"
- Subtext: `text-sm text-muted-foreground` — "Last updated: March 2026"
- `h2`: `text-xl font-semibold` — each section title
- Body: `text-base leading-relaxed text-muted-foreground`
- Lists: `list-disc pl-6 space-y-2`

**Footer links** at bottom:
- "Privacy Policy" → `/privacy` (internal, since we are building that page next)
- "Terms" → `/terms`
- Styled as small muted text links, consistent with legal page conventions

**Content**: All 13 approved sections rendered statically. No new colors, components, or dependencies.

## 2. Update `src/App.tsx`

- Import `Terms`
- Add `<Route path="/terms" element={<Terms />} />` in the public routes block (next to `/auth`, `/forgot-password`, etc.)

## Constraints
- No auth guard
- No new dependencies
- Mobile-readable out of the box via the constrained `max-w-3xl` container

