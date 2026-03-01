

## Piano: Admin Dashboard — Coaches Overview + Feedback

### Obiettivo

Aggiungere due nuove sezioni alla dashboard admin:
1. **Coaches Overview** — tabella con metriche aggregate per ogni coach iscritto
2. **Feedback Reader** — tabella con i feedback raccolti dalla tabella `feedback`

### Architettura

La dashboard admin attuale ha 3 card (Inviti, Utenti, Sistema). Le card "Utenti" e "Sistema" sono placeholder. Trasformeremo la card "Utenti" in un link a una nuova pagina `/admin/coaches` e la card "Sistema" resterà coming soon oppure diventerà il link ai feedback.

In alternativa, per mantenere la dashboard compatta: le due funzionalità saranno due nuove pagine accessibili dalla dashboard.

### Dettaglio tecnico

#### 1. Coaches Overview (`/admin/coaches`)

La RPC `admin_get_coaches_overview` esiste già nel database e restituisce:
- `id`, `email`, `first_name`, `last_name`, `created_at`, `last_sign_in_at`
- `active_clients_count`, `total_events_count`, `total_plans_count`

Nessuna migrazione necessaria. Serve solo il frontend.

**File da creare:**
- `src/features/admin/api/coaches.api.ts` — chiama `supabase.rpc('admin_get_coaches_overview')`
- `src/features/admin/hooks/useCoachesOverview.ts` — hook React Query
- `src/features/admin/components/CoachesOverviewTable.tsx` — tabella con colonne: Nome, Email, Clienti attivi, Sessioni, Piani, Ultimo accesso, Iscritto dal
- `src/pages/admin/AdminCoaches.tsx` — pagina con layout coerente a AdminInvites (back button, SectionShell, Card wrapper)

#### 2. Feedback Reader (`/admin/feedback`)

La tabella `feedback` esiste con colonne: `id`, `user_id`, `user_email`, `type`, `section`, `message`, `page`, `status`, `created_at`.

Attualmente le RLS permettono solo agli utenti di leggere i propri feedback. Serve una nuova policy per admin.

**Migrazione DB:**
- Aggiungere policy RLS SELECT sulla tabella `feedback` per admin: `has_role(auth.uid(), 'admin')`

**File da creare:**
- `src/features/admin/api/feedback.api.ts` — fetch di tutti i feedback ordinati per data
- `src/features/admin/hooks/useAdminFeedback.ts` — hook React Query
- `src/features/admin/components/FeedbackTable.tsx` — tabella con colonne: Data, Email, Tipo (badge), Sezione, Pagina, Messaggio, Status
- `src/pages/admin/AdminFeedback.tsx` — pagina con layout coerente

#### 3. Aggiornamenti esistenti

- **`src/pages/admin/AdminDashboard.tsx`** — le card "Utenti" e placeholder diventano link attivi a `/admin/coaches` e `/admin/feedback`
- **`src/App.tsx`** — aggiungere le due nuove route dentro `<Route element={<AdminLayout />}>`

### Riepilogo modifiche

| Area | Azione |
|------|--------|
| DB Migration | 1 policy RLS: admin SELECT su `feedback` |
| Nuovi file | 8 file (2 api, 2 hooks, 2 componenti, 2 pagine) |
| File modificati | 2 (AdminDashboard.tsx, App.tsx) |
| RPC esistente | `admin_get_coaches_overview` — nessuna modifica |

