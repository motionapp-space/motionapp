

# Add Privacy Policy Link to Registration Checkbox

## Current state
The registration form in `src/pages/Auth.tsx` (line 437-445) has a terms acceptance checkbox that links only to `/terms`. The `/privacy` link is missing.

## Change

**`src/pages/Auth.tsx` lines 437-445** — Update the label text to include both links:

```
Accetto i{" "}
<a href="/terms" target="_blank" ...>Termini e Condizioni</a>
{" "}e la{" "}
<a href="/privacy" target="_blank" ...>Privacy Policy</a>
```

Same styling for both links: `text-primary hover:underline font-medium` with `onClick={(e) => e.stopPropagation()}`.

No other files need changes — the `/terms` link is already internal and correct.

