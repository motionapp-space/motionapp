

## Aggiunta "Ultimo accesso" alla Overview Coaches

### Cosa cambia

Aggiungere una colonna **Ultimo accesso** nella tabella coaches overview, mostrando la data dell'ultimo login di ciascun coach.

### Fonte dato

Il campo `auth.users.last_sign_in_at` contiene il timestamp dell'ultimo login. Essendo nello schema `auth`, non e accessibile via client — ma una funzione `security definer` puo leggerlo.

### Modifica alla funzione DB `admin_get_coaches_overview`

Aggiungere `last_sign_in_at timestamptz` al tipo di ritorno e joinare `auth.users` nella query:

```sql
create or replace function public.admin_get_coaches_overview()
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  created_at timestamptz,
  active_clients_count bigint,
  total_events_count bigint,
  total_plans_count bigint,
  last_sign_in_at timestamptz   -- NUOVO
)
language sql stable security definer
set search_path = public
as $$
  select
    c.id,
    u.email,
    u.first_name,
    u.last_name,
    c.created_at,
    (select count(*) from coach_clients cc where cc.coach_id = c.id and cc.status = 'active'),
    (select count(*) from events e join coach_clients cc on cc.id = e.coach_client_id where cc.coach_id = c.id),
    (select count(*) from client_plans cp join coach_clients cc on cc.id = cp.coach_client_id where cc.coach_id = c.id),
    au.last_sign_in_at            -- NUOVO: da auth.users
  from coaches c
  join users u on u.id = c.id
  join auth.users au on au.id = c.id   -- NUOVO join
  where has_role(auth.uid(), 'admin')
  order by c.created_at desc
$$;
```

Nota: la funzione e `security definer`, quindi puo accedere a `auth.users` anche se l'utente normale non potrebbe. Il check `has_role(auth.uid(), 'admin')` resta la guardia di sicurezza.

### Modifiche frontend

**`src/features/admin/api/coachesOverview.api.ts`**
- Aggiungere `last_sign_in_at` al tipo di ritorno

**`src/features/admin/components/CoachesOverviewTable.tsx`**
- Aggiungere colonna "Ultimo accesso" nella tabella
- Formattare con `format(date, 'd MMM yyyy')` o mostrare "Mai" se `null`
- Posizionare dopo "Iscritto il"

### Layout risultante

```text
Nome     Email      Iscritto il  Ultimo accesso  Clienti  Sessioni  Piani
Harry P. potter@..  7 feb 26     25 feb 26        4        8         9
Lex L.   lex@..     3 feb 26     Mai              9        0         5
```

