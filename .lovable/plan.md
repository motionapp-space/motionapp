

# Increase Area Fill Visibility in Revenue Chart

## Change

**`ActivityTrendCard.tsx`** — Increase the gradient opacity from `0.1 → 0` to `0.25 → 0.03`:

- Top stop: `stopOpacity={0.1}` → `stopOpacity={0.25}`
- Bottom stop: `stopOpacity={0}` → `stopOpacity={0.03}`

This makes the fill clearly visible while keeping it elegant — similar to Vercel/Linear chart styling.

**1 file, 2 lines changed.**

