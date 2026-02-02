
# Piano: Sezione Admin Protetta (MVP)

## Panoramica

Implementazione di una sezione `/admin` accessibile esclusivamente agli utenti con ruolo `admin`, con dashboard minimal e architettura estendibile.

---

## File da Creare

### 1. `src/features/auth/api/roles.api.ts`
API per recuperare tutti i ruoli dell'utente corrente:

```typescript
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types/user";

export async function getCurrentUserRoles(): Promise<AppRole[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
  
  return data?.map(r => r.role as AppRole) || [];
}
```

### 2. `src/features/auth/hooks/useUserRoles.ts`
Hook con `roles`, `isAdmin`, `isLoading`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { getCurrentUserRoles } from "../api/roles.api";

export function useUserRoles() {
  const query = useQuery({
    queryKey: ["userRoles"],
    queryFn: getCurrentUserRoles,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  
  const roles = query.data || [];
  
  return {
    roles,
    isAdmin: roles.includes('admin'),
    isCoach: roles.includes('coach'),
    isClient: roles.includes('client'),
    isLoading: query.isLoading,
  };
}
```

### 3. `src/components/admin/AdminLayout.tsx`
Layout protetto che:
- Verifica autenticazione Supabase
- Verifica ruolo admin tramite `useUserRoles`
- Mostra loading durante verifica
- Redirect a `/` se non admin
- Renderizza `<Outlet />` se autorizzato

### 4. `src/pages/admin/AdminDashboard.tsx`
Dashboard v0 minimal con:
- Titolo "Admin Dashboard"
- Card con icona Shield e descrizione
- 3 placeholder card per future funzionalita (Inviti, Utenti, Sistema)
- Usa `SectionShell` per consistenza layout

---

## File da Modificare

### `src/App.tsx`
Aggiungere import e route admin PRIMA delle route coach (riga 151):

```typescript
// Nuovi import
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";

// Nuove route (PRIMA di CoachLayout)
<Route element={<AdminLayout />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Route>
```

---

## Sicurezza

| Livello | Implementazione |
|---------|-----------------|
| Frontend | `AdminLayout` verifica `isAdmin` prima di renderizzare |
| Backend | RLS policies con `has_role(auth.uid(), 'admin')` (gia esistente) |

---

## Setup Manuale Admin

Dopo l'implementazione, eseguire via SQL:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin');
```

---

## Risultato Atteso

- `/admin` con utente admin: visualizza dashboard
- `/admin` senza ruolo admin: redirect automatico a `/`
- Codice pulito e pronto per estensioni future
