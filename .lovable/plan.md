

# Piano: Auth State Centralizzato

## Problema Identificato

Dopo il login, 5+ componenti chiamano `supabase.auth.getSession()` / `getUser()` indipendentemente:

| Componente | Chiamata Auth | Problema |
|------------|---------------|----------|
| `App.tsx` | `getSession()` | OK - fonte principale |
| `CoachLayout` | via `useUserRoles()` → `getUser()` | Duplicata |
| `AdminLayout` | `getSession()` | Duplicata |
| `ClientAppLayout` | `getSession()` | Duplicata |
| `useOnboardingState` | `getSession()` | Duplicata |
| `useUserRoles` → `roles.api.ts` | `getUser()` | Duplicata |
| `useCurrentUser` → `users.api.ts` | `getUser()` | Duplicata |

Ogni chiamata crea uno stato loading indipendente, causando rendering frammentati (topbar incompleta, spinner tardivi, avatar vuoto).

---

## Soluzione

Centralizzare lo stato auth in un `AuthContext` minimalista e propagare `userId` a tutti gli hook che lo necessitano.

---

## Modifiche Tecniche

### 1. Creare AuthContext

**File:** `src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, ReactNode } from "react";
import { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  userId: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ 
  user, 
  isLoading, 
  children 
}: { 
  user: User | null;
  isLoading: boolean;
  children: ReactNode; 
}) {
  return (
    <AuthContext.Provider value={{ 
      user, 
      userId: user?.id ?? null, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

**Caratteristiche:**
- Espone SOLO `user`, `userId`, `isLoading`
- Nessuna logica business o ruoli
- Pattern identico a `ClientAuthContext` esistente

---

### 2. Aggiornare App.tsx

**Modifiche:**
- Wrappare le Routes con `<AuthProvider />`
- Passare lo stato auth gia calcolato
- Mantenere logica check ruoli coach per `CoachSessionInitializer`

```typescript
// Prima (Routes senza context)
<Routes>
  ...
</Routes>

// Dopo (Routes con AuthProvider)
<AuthProvider user={user} isLoading={loading}>
  <Routes>
    ...
  </Routes>
</AuthProvider>
```

---

### 3. Refactor useUserRoles

**File:** `src/features/auth/hooks/useUserRoles.ts`

```typescript
// Prima
export function useUserRoles() {
  const query = useQuery({
    queryKey: ["userRoles"],
    queryFn: getCurrentUserRoles, // chiama getUser() internamente
    ...
  });
}

// Dopo
export function useUserRoles() {
  const { userId, isLoading: authLoading } = useAuth();
  
  const query = useQuery({
    queryKey: ["userRoles", userId],
    queryFn: () => fetchRolesForUser(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    roles: query.data || [],
    isAdmin: query.data?.includes('admin') ?? false,
    isCoach: query.data?.includes('coach') ?? false,
    isClient: query.data?.includes('client') ?? false,
    isLoading: authLoading || query.isLoading,
  };
}
```

**Nota:** `isLoading` include `authLoading` per evitare flash quando auth e ancora pending.

---

### 4. Refactor roles.api.ts

**File:** `src/features/auth/api/roles.api.ts`

```typescript
// Prima
export async function getCurrentUserRoles(): Promise<AppRole[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // ...
}

// Dopo
export async function fetchRolesForUser(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
  
  return data?.map(r => r.role as AppRole) || [];
}

// Manteniamo la vecchia funzione per retrocompatibilita (altri file la usano)
export async function getCurrentUserRoles(): Promise<AppRole[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return fetchRolesForUser(user.id);
}
```

---

### 5. Refactor useOnboardingState

**File:** `src/features/clients/hooks/useOnboardingState.ts`

```typescript
// Prima
export function useOnboardingState() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(...); // DUPLICATA
    supabase.auth.onAuthStateChange(...);  // DUPLICATA
  }, []);
  // ...
}

// Dopo
export function useOnboardingState() {
  const { userId, isLoading: authLoading } = useAuth();

  const onboardingQuery = useQuery({
    queryKey: ['coach-onboarding', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_coach_onboarding_data', {
        p_coach_id: userId
      });
      if (error) throw error;
      return data as unknown as CoachOnboardingData;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const isLoading = authLoading || onboardingQuery.isLoading;
  // ...
}
```

**Rimozione:** Tutto il `useEffect` con `getSession()` viene eliminato.

---

### 6. Refactor useCurrentUser

**File:** `src/features/auth/hooks/useCurrentUser.ts`

```typescript
// Prima
export function useCurrentUser() {
  return useQuery<UserWithRole | null>({
    queryKey: ["currentUser"],
    queryFn: getCurrentUserWithRole, // chiama getUser() internamente
    ...
  });
}

// Dopo
export function useCurrentUser() {
  const { userId, isLoading: authLoading } = useAuth();
  
  const query = useQuery<UserWithRole | null>({
    queryKey: ["currentUser", userId],
    queryFn: () => fetchUserProfileWithRole(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    ...query,
    isLoading: authLoading || query.isLoading,
  };
}
```

---

### 7. Refactor users.api.ts

**File:** `src/features/auth/api/users.api.ts`

```typescript
// Nuova funzione parametrica
export async function fetchUserProfileWithRole(userId: string): Promise<UserWithRole | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return null;
    }

    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles = rolesData?.map(r => r.role as AppRole) || [];
    const role: AppRole = roles.includes('coach') 
      ? 'coach' 
      : roles.includes('client') 
        ? 'client' 
        : 'client';

    return {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      role,
    };
  } catch (error) {
    console.error('Unexpected error in fetchUserProfileWithRole:', error);
    return null;
  }
}

// Manteniamo la vecchia per retrocompatibilita
export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return fetchUserProfileWithRole(user.id);
}
```

---

### 8. Aggiornare Layout (CoachLayout, AdminLayout, ClientAppLayout)

I layout possono ora rimuovere le chiamate auth duplicate perche ricevono lo stato dal context:

**CoachLayout:**
- `isAuthenticated` prop gia ricevuta da App.tsx - OK
- `useUserRoles()` ora usa context internamente - OK automatico

**AdminLayout:**
```typescript
// Prima
const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
useEffect(() => {
  supabase.auth.getSession().then(...); // RIMUOVERE
}, []);

// Dopo
const { userId, isLoading: authLoading } = useAuth();
const { isAdmin, isLoading: rolesLoading } = useUserRoles();

if (authLoading || rolesLoading) {
  return <Spinner message="Verifica autorizzazioni..." />;
}

if (!userId) {
  return <Navigate to="/auth" replace />;
}
```

**ClientAppLayout:**
```typescript
// Prima
const [user, setUser] = useState<User | null>(null);
useEffect(() => {
  supabase.auth.getSession().then(...); // RIMUOVERE
}, []);

// Dopo
const { user, userId, isLoading: authLoading } = useAuth();

if (authLoading) {
  return <Spinner />;
}

if (!userId) {
  return <Navigate to="/client/auth" replace />;
}
```

---

## File Coinvolti

| File | Azione |
|------|--------|
| `src/contexts/AuthContext.tsx` | **Nuovo** |
| `src/App.tsx` | Modifica (aggiungere AuthProvider) |
| `src/features/auth/hooks/useUserRoles.ts` | Modifica (usare context) |
| `src/features/auth/api/roles.api.ts` | Modifica (aggiungere fetchRolesForUser) |
| `src/features/clients/hooks/useOnboardingState.ts` | Modifica (usare context) |
| `src/features/auth/hooks/useCurrentUser.ts` | Modifica (usare context) |
| `src/features/auth/api/users.api.ts` | Modifica (aggiungere fetchUserProfileWithRole) |
| `src/components/admin/AdminLayout.tsx` | Modifica (usare context) |
| `src/components/client/ClientAppLayout.tsx` | Modifica (usare context) |

---

## Flusso Risultante

```text
App.tsx mount
    |
    v
supabase.auth.getSession() ← UNICA chiamata auth
    |
    v
[loading = true] → Spinner globale
    |
    v
Sessione ricevuta → [loading = false]
    |
    v
<AuthProvider user={user} isLoading={false}>
    |
    ├─→ CoachLayout
    │       └─ useUserRoles() → query ruoli (enabled: !!userId)
    │       └─ isLoading coordina con authLoading
    │
    ├─→ AdminLayout
    │       └─ useAuth() per userId
    │       └─ useUserRoles() per isAdmin
    │
    └─→ ClientAppLayout
            └─ useAuth() per userId
            └─ useUserRoles() per isClient
```

---

## Retrocompatibilita

Le funzioni originali (`getCurrentUserRoles`, `getCurrentUserWithRole`) rimangono per evitare di rompere gli altri 51 file che le usano. Queste funzioni ora delegano alle nuove versioni parametriche.

---

## Checklist Regressioni

**Tecnica:**
- Nessuna chiamata `getSession()`/`getUser()` duplicata nei layout/hook principali
- Query key include `userId` per cache isolation
- `enabled: !!userId` previene query con userId null

**Funzionale:**
- Login coach → spinner unico → home completa
- Login admin → spinner unico → dashboard
- Login client → spinner unico → client app
- Refresh pagina → stato preservato via session listener in App.tsx
- Logout → `queryClient.clear()` gia implementato in App.tsx

---

## Impatto Atteso

| Metrica | Prima | Dopo |
|---------|-------|------|
| Chiamate auth parallele | 4-5 | 1 |
| Stati loading indipendenti | 5+ | 1 (context) + N (queries) |
| Flash UI visibili | 3-4 | 0 |
| Transizioni | Frammentate | Fluida |

