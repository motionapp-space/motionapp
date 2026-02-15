

## MOTION DESIGN SYSTEM — Piano di Implementazione

### Panoramica

Refactor strutturale del sistema colori dell'intera applicazione. Si passa da una palette con primary blu e accent verde a un sistema ink-based (primary quasi nero) con accent Ice Neutral (interazione overlay). Si centralizzano tutti i token, si eliminano i colori hardcoded e si allineano tutti i componenti.

**Impatto stimato**: ~15 file core + ~30 file con violazioni colore sparse.

---

### Fase 1 — Token CSS centralizzati

**Nuovo file**: `src/styles/motion-tokens.css`

Contiene tutte le variabili CSS light + dark, organizzate per sezione:
- **Surfaces**: `--background: 220 14% 98%`, `--card: 220 14% 98%`, `--popover: 220 14% 98%`, `--muted: 220 12% 96%`, `--secondary: 0 0% 100%`
- **Ink scale**: `--foreground: 220 15% 6%`, `--ink-900: 220 15% 8%`, `--ink-700: 220 10% 30%`, `--muted-foreground: 220 8% 48%`
- **Primary (ink-based)**: `--primary: 220 15% 10%`, `--primary-hover: 220 15% 6%`, `--primary-foreground: 0 0% 100%`
- **Accent (Ice Neutral)**: `--accent: 222 35% 68%`, overlay tokens `--accent-soft-2`, `--accent-soft-4`, `--accent-soft-6`, `--selection-border`
- **Semantici**: `--success`, `--warning`, `--destructive` (invariati)
- **Sidebar (dark signature)**: background scuro, accent bar
- **Dark mode**: tutti i token ridefiniti per il tema scuro

**Modifica**: `src/index.css`
- Rimuovere tutti i token colore da `:root` e `.dark` (spostati in motion-tokens.css)
- Aggiungere `@import './styles/motion-tokens.css'` prima di `@tailwind base`
- Rimuovere fallback `#fff` dalla classe `.token-card`

---

### Fase 2 — Tailwind config allineato

**Modifica**: `tailwind.config.ts`

Aggiungere i nuovi mapping:
- `ink-900`, `ink-700` per la scala tipografica
- `accent-soft-2`, `accent-soft-4`, `accent-soft-6`, `selection-border` come colori arbitrari via `hsl(var(--token))`
- `ring` aggiornato da blu a accent

---

### Fase 3 — Export TypeScript

**Nuovo file**: `src/design/tokens.ts`

Esporta l'oggetto `motionTokens` con tutte le sezioni (surfaces, ink, primary, accent, semantic, sidebar) come oggetti con chiavi token e valori HSL stringa. Utile per audit, storybook e linting futuro.

---

### Fase 4 — Fix Auth pages (5 file)

Tutte le pagine auth usano colori hardcoded. Sostituzioni:

| File | Da | A |
|------|----|---|
| `Auth.tsx` | `bg-[hsl(0,0%,96%)]` | `bg-muted` |
| `Auth.tsx` | `bg-[hsl(220,70%,95%)]` | `bg-[hsl(var(--accent-soft-6))]` |
| `ClientAuth.tsx` | stesse sostituzioni | stesse |
| `ClientAcceptInvite.tsx` | stesse (4 occorrenze) | stesse |
| `ResetPassword.tsx` | stesse (4 occorrenze) | stesse |
| `ForgotPassword.tsx` | stesse (2 occorrenze) | stesse |

---

### Fase 5 — Fix MobileNav

**Modifica**: `src/components/MobileNav.tsx`

Stato attivo attuale: `bg-primary/10 text-primary` (era blu, ora sarebbe nero/10 — non ottimale)

Nuovo stato attivo allineato al sistema Accent Ice:
- Active: `bg-[hsl(var(--accent-soft-6))] border border-[hsl(var(--selection-border))] text-foreground font-semibold`
- Hover: `bg-[hsl(var(--accent-soft-2))]`
- Indicatore barra: `bg-[hsl(var(--accent))]` (invece di `bg-primary/80`)
- Focus ring: `focus-visible:ring-[hsl(var(--accent))]`

---

### Fase 6 — Fix Calendar views (DayView + WeekView)

**Modifica**: `src/features/events/components/DayView.tsx` e `WeekView.tsx`

| Da | A |
|----|---|
| `bg-white` | `bg-card` |
| `border-slate-200/40` | `border-border/40` |
| `border-slate-200/80` | `border-border/80` |

---

### Fase 7 — Audit violazioni sparse

**Sostituzioni globali per pattern**:

| Pattern | Sostituzione | File stimati |
|---------|-------------|--------------|
| `bg-white` (2 file calendar) | `bg-card` | 2 |
| `border-slate-*` (2 file calendar) | `border-border/*` | 2 |
| `bg-gray-50` / `text-gray-*` / `border-gray-*` | token semantici (`bg-muted`, `text-muted-foreground`, `border-border`) | 3 file badges/invite |
| `bg-green-50/100` / `text-green-600/700/900` / `border-green-200` | `bg-accent/10` + `text-foreground` + `border-accent/40` (success pattern) | ~8 file |
| `bg-red-50` / `text-red-*` / `border-red-*` | `bg-destructive/10` + `text-foreground` + `border-destructive/40` | ~4 file |
| `bg-blue-50` / `text-blue-*` / `border-blue-*` | `bg-primary/5` + `text-foreground` + `border-primary/20` | ~3 file |
| `bg-yellow-50` / `text-yellow-*` | `bg-warning/10` + `text-foreground` + `border-warning/40` | ~2 file |
| `text-green-600` (password match) | `text-accent` | 2 file auth |
| `#fff` in index.css | rimosso | 1 |
| `[stroke='#fff']` / `[stroke='#ccc']` in chart.tsx | invariati (sono selettori CSS per Recharts, non token applicativi) | 0 |

**File con violazioni semantiche (green/red/blue/yellow/gray) che necessitano fix individuale**:
- `ClientInviteSection.tsx` (green success states, red/gray badges)
- `InviteLinkDialog.tsx` (green success)
- `PackageStatusBadge.tsx` (gray badge)
- `ActivePlanBadge.tsx` (gray badge)
- `ClientPlanEditor.tsx` (blue info banner)
- `BookingRequestDrawer.tsx` (blue badge)
- `ResetPassword.tsx` (green success icon)
- `Auth.tsx` (green password match)
- `PlanEditorSaveBar.tsx` (green check icon)
- `toast.tsx` (red destructive — selettori Radix, da valutare)

Nota: le sostituzioni dei colori semantici (green -> success, red -> destructive, blue -> info/primary, yellow -> warning) richiedono l'aggiunta del token `--success` e `--warning` se non gia' presenti. Attualmente `--destructive` esiste. Servono:
- `--success: 150 60% 40%` (light) / `150 50% 50%` (dark)
- `--warning: 38 92% 50%` (light) / `38 85% 55%` (dark)

---

### Fase 8 — client-colors.ts (eventi calendario)

**Modifica**: `src/features/events/utils/client-colors.ts`

Sostituire i colori HSL hardcoded con riferimenti ai token `--client-N` gia' definiti nel CSS:
```text
const CLIENT_COLORS = [
  "hsl(var(--client-1))",
  "hsl(var(--client-2))",
  ...
];
```

---

### Cose che NON cambiano

- Logica applicativa, routing, API, RPC
- Struttura componenti
- Layout e spacing
- Font family e tipografia (gia' corretti)
- Selettori Recharts interni a chart.tsx (sono CSS selector strings, non token)
- Token `--client-1` through `--client-8` (gia' nel CSS)

---

### Sequenza di implementazione

1. Creare `motion-tokens.css` con tutti i token
2. Aggiornare `index.css` (import + rimozione duplicati)
3. Aggiornare `tailwind.config.ts`
4. Creare `tokens.ts`
5. Fix Auth pages (5 file)
6. Fix MobileNav
7. Fix Calendar views (2 file)
8. Audit e fix violazioni sparse (~10-12 file)
9. Fix client-colors.ts

---

### Sezione tecnica — Token completi

**Light mode (`:root`)**:
```text
--background: 220 14% 98%
--foreground: 220 15% 6%
--ink-900: 220 15% 8%
--ink-700: 220 10% 30%
--card: 220 14% 98%
--card-foreground: 220 15% 6%
--popover: 220 14% 98%
--popover-foreground: 220 15% 6%
--primary: 220 15% 10%
--primary-foreground: 0 0% 100%
--primary-hover: 220 15% 6%
--secondary: 0 0% 100%
--secondary-foreground: 220 15% 6%
--muted: 220 12% 96%
--muted-foreground: 220 8% 48%
--accent: 222 35% 68%
--accent-foreground: 0 0% 100%
--accent-hover: 222 35% 60%
--accent-soft-2: 222 35% 68% / 0.35
--accent-soft-4: 222 35% 68% / 0.55
--accent-soft-6: 222 35% 68% / 0.70
--selection-border: 222 35% 68% / 0.50
--destructive: 0 72% 51%
--destructive-foreground: 0 0% 100%
--success: 150 60% 40%
--success-foreground: 0 0% 100%
--warning: 38 92% 50%
--warning-foreground: 220 15% 6%
--border: 220 15% 90%
--input: 220 15% 90%
--ring: 222 35% 68%
--sidebar-background: 220 15% 8%
--sidebar-foreground: 0 0% 90%
--sidebar-primary: 0 0% 100%
--sidebar-primary-foreground: 220 15% 8%
--sidebar-accent: 220 12% 16%
--sidebar-accent-foreground: 0 0% 90%
--sidebar-border: 220 12% 18%
--sidebar-ring: 222 35% 68%
--sidebar-active: 220 12% 14%
```

**Dark mode (`.dark`)**:
```text
--background: 220 15% 8%
--foreground: 0 0% 95%
--ink-900: 0 0% 92%
--ink-700: 0 0% 75%
--card: 220 12% 14%
--card-foreground: 0 0% 95%
--popover: 220 12% 14%
--popover-foreground: 0 0% 95%
--primary: 220 15% 20%
--primary-foreground: 0 0% 100%
--primary-hover: 220 15% 16%
--secondary: 220 10% 22%
--secondary-foreground: 0 0% 95%
--muted: 220 12% 18%
--muted-foreground: 220 10% 72%
--accent: 222 35% 72%
--accent-foreground: 0 0% 100%
--accent-hover: 222 35% 65%
--accent-soft-2: 222 35% 72% / 0.35
--accent-soft-4: 222 35% 72% / 0.55
--accent-soft-6: 222 35% 72% / 0.70
--selection-border: 222 35% 72% / 0.50
--destructive: 0 72% 51%
--destructive-foreground: 0 0% 100%
--success: 150 50% 50%
--success-foreground: 0 0% 100%
--warning: 38 85% 55%
--warning-foreground: 0 0% 95%
--border: 220 12% 22%
--input: 220 12% 22%
--ring: 222 35% 72%
--sidebar-background: 220 15% 6%
--sidebar-foreground: 0 0% 90%
--sidebar-primary: 0 0% 100%
--sidebar-primary-foreground: 220 15% 6%
--sidebar-accent: 220 12% 14%
--sidebar-accent-foreground: 0 0% 90%
--sidebar-border: 220 12% 16%
--sidebar-ring: 222 35% 72%
--sidebar-active: 220 12% 12%
```

