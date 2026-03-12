

# Update Privacy Section in Settings

## What to change

Update the Privacy tab in `src/pages/Settings.tsx` (lines 238-262) to replace the external iubenda links with internal links to `/privacy` and `/terms`, and rename the tab to "Privacy e Termini" to reflect both pages.

## Changes in `src/pages/Settings.tsx`

**Lines 248-258** — Replace the two external link buttons:
- "Informativa Privacy" → internal `Link` to `/privacy`
- "Politica Cookie" → replace with "Termini e Condizioni" linking to `/terms`

Use `react-router-dom`'s `Link` component (already imported) instead of `<a>` tags. Keep the same `Button variant="outline"` pattern. Links open in same tab since they're internal pages.

