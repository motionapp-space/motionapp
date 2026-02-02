

# Piano: Magic Link Invito Coach (MVP) - Versione Finale

## Panoramica

Modificare la pagina di autenticazione esistente (`/auth`) per supportare la registrazione coach tramite magic link. Il flusso diventa:

1. Admin crea invito in `/admin/invites`
2. Sistema genera codice leggibile (es. `MOTION-8F3K`)
3. Admin copia magic link `/auth?invite=CODE`
4. Coach invitato accede al link e vede SOLO il form di registrazione
5. Dopo registrazione, diventa coach automaticamente

---

## Fase 1: Database

### Nuova tabella `coach_invites`

```sql
CREATE TABLE public.coach_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  email TEXT,
  max_uses INTEGER DEFAULT 1 NOT NULL CHECK (max_uses > 0),
  used_count INTEGER DEFAULT 0 NOT NULL CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  CONSTRAINT used_count_lte_max_uses CHECK (used_count <= max_uses)
);

CREATE INDEX idx_coach_invites_code ON public.coach_invites(code);

ALTER TABLE public.coach_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view coach invites"
  ON public.coach_invites FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can create coach invites"
  ON public.coach_invites FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

Note tecniche:
- `created_by` nullable con `ON DELETE SET NULL`: l'invito persiste anche se l'admin viene eliminato
- Nessuna policy UPDATE: il service_role (usato dalle edge function) bypassa RLS
- L'incremento di `used_count` avviene solo tramite edge function trusted

---

## Fase 2: Edge Functions

### 2.1 Nuova function: `validate-coach-invite`

Endpoint pubblico per validare un codice invito:

- **Input**: `{ "code": "MOTION-8F3K" }`
- **Validazioni**:
  - Codice esiste
  - `used_count < max_uses`
  - `expires_at > now()`
- **Output**: `{ "valid": true }` o errore specifico in italiano

### 2.2 Modifica `signup-coach`

Estendo la funzione esistente:

1. Parametro `invite_code` obbligatorio per signup pubblico
2. Validazione invito prima di creare l'utente
3. Incremento `used_count` solo dopo signup riuscito
4. Se `invite_code` assente/invalido: rifiuta registrazione

Nota design: in futuro admin/service potrebbero creare coach senza invito (bypass interno).

---

## Fase 3: Modifica Auth.tsx

### Comportamento con parametro `invite`

**Se `invite` presente nella URL:**
1. Chiama `validate-coach-invite` all'avvio
2. Se valido:
   - Nasconde tab toggle, mostra solo form registrazione
   - Banner "Registrazione su invito"
3. Se invalido:
   - Mostra errore specifico
   - CTA "Contatta l'amministratore"

**Se `invite` assente:**
- Mostra solo tab "Accedi"
- Tab "Registrati" nascosta (registrazione pubblica disabilitata)

### Flusso submit registrazione

1. Chiama `signup-coach` con `invite_code`
2. Se successo: switch a login con toast
3. Se errore: messaggio appropriato

---

## Fase 4: Sezione Admin Inviti

### 4.1 Nuova pagina `/admin/invites`

Componenti:
- `AdminInvites.tsx`: pagina principale
- `CoachInvitesList.tsx`: tabella inviti con badge stato
- `CreateInviteDialog.tsx`: dialog creazione invito

### 4.2 Funzionalita UI

- Lista inviti con:
  - Codice
  - Stato (badge colorato: verde=valido, giallo=scaduto, rosso=usato)
  - Data creazione e scadenza
- Bottone "Crea invito coach": genera codice `MOTION-XXXX`, scadenza 7 giorni
- Bottone "Copia link": copia `/auth?invite=CODE`

### 4.3 Generazione codice

Formato `MOTION-XXXX` con caratteri non ambigui (esclusi I, O, 0, 1).

---

## Fase 5: Routing

### Aggiornare App.tsx

```tsx
<Route element={<AdminLayout />}>
  <Route path="/admin" element={<AdminDashboard />} />
  <Route path="/admin/invites" element={<AdminInvites />} />
</Route>
```

### Aggiornare AdminDashboard.tsx

Card "Inviti" cliccabile con link a `/admin/invites`.

---

## Struttura File

```text
NUOVI FILE:
src/pages/admin/AdminInvites.tsx
src/features/admin/api/coachInvites.api.ts
src/features/admin/hooks/useCoachInvites.ts
src/features/admin/components/CoachInvitesList.tsx
src/features/admin/components/CreateInviteDialog.tsx
src/features/admin/utils/generateInviteCode.ts
supabase/functions/validate-coach-invite/index.ts

FILE MODIFICATI:
src/pages/Auth.tsx
src/pages/admin/AdminDashboard.tsx
src/App.tsx
supabase/functions/signup-coach/index.ts
supabase/config.toml
```

---

## Edge Cases

| Caso | Comportamento |
|------|---------------|
| Codice invalido | Errore + "Contatta l'amministratore" |
| Codice scaduto | "Invito scaduto" |
| Codice gia usato | "Invito gia utilizzato" |
| /auth senza codice | Solo login visibile |
| Email gia registrata | Errore Supabase Auth |

---

## Sicurezza

1. RLS: solo admin gestiscono `coach_invites`
2. UPDATE: nessuna policy, solo service_role puo modificare
3. Validazione: sempre server-side in edge function
4. Atomicita: invito consumato solo dopo signup riuscito
5. Registrazione chiusa: senza invito valido, tab nascosta

