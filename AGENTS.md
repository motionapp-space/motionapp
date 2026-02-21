# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-14
**Type:** Coach/PT Management Platform (Motion App)

## OVERVIEW
A React/Vite/Supabase application for Personal Trainers to manage clients, training plans, and sessions. Features a complex JSON-based plan editor, calendar scheduling, and AI copilot integration.

## STRUCTURE
```
src/
├── features/         # Domain logic (auth, plans, sessions, clients)
├── components/       # Shared UI (shadcn-ui)
├── stores/           # Global state (Zustand: usePlanStore, useSessionStore)
├── types/            # Domain models (Plan, Client, User)
├── integrations/     # Supabase client & generated types
└── pages/            # Route components
supabase/
└── migrations/       # DB Schema definitions
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Plan Editor** | `src/features/plans/` | Complex nested JSON structure (Days->Phases->Exercises) |
| **Session Tracking** | `src/features/sessions/` | Active session state, timing, exercise tracking |
| **DB Schema** | `supabase/migrations/` | PostgreSQL schema (check `docs/schema_diff_report.md` for status) |
| **State Management** | `src/stores/` | `usePlanStore` (editor), `useSessionStore` (execution) |
| **Calendar** | `src/features/events/` | Booking & availability logic |

## KEY CONCEPTS

### Training Plans (JSON vs Relational)
- Plans are stored as **JSON documents** (`content_json`) in `plans` table.
- Structure: `Plan -> Days[] -> Phases[] -> Groups[] -> Exercises[]`.
- **Migration Note**: There is a long-term goal to normalize this into `plan_days` etc., but currently it's JSON.

### Database Schema (Core)
- **Identity**: `auth.users` linked to `public.coaches` and `public.clients`.
- **Clients**: `clients` table with profile info.
- **Sessions**: `training_sessions` tracks execution of a plan.
- **Events**: `events` table for calendar/booking.

### User Roles
- **Coach**: Creates plans, manages clients.
- **Client**: Views plans, executes sessions.
- **Admin**: System management.

## COMMANDS
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npx supabase gen types typescript --project-id ... > src/integrations/supabase/types.ts # Update types
```
