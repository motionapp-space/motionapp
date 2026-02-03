
# Piano: Spinner Unico Unificato

## Problema Identificato

Attualmente l'utente vede fino a **3-4 spinner in sequenza** durante il caricamento:

| Step | File | Testo | Durata |
|------|------|-------|--------|
| 1 | `App.tsx` | "Caricamento..." | ~100-200ms |
| 2 | `CoachLayout.tsx` | "Verifica autorizzazioni..." | ~50-150ms |
| 3 | `Clients.tsx` | Loader2 icon | ~50-100ms |
| 4 | (Client) `ClientAppLayout.tsx` | "Caricamento profilo..." | ~100-150ms |

Questo accade perché:
1. `App.tsx` aspetta solo `getSession()`, poi sblocca
2. `CoachLayout` aspetta `useUserRoles()` (query separata)
3. `Clients.tsx` aspetta `useOnboardingState()` (RPC separata)
4. Ogni step mostra il proprio spinner separatamente

---

## Soluzione

### Strategia: Pre-caricare i ruoli in App.tsx

Modificare `App.tsx` per:
1. Dopo `getSession()`, se c'è un utente, fetchare **anche i ruoli** prima di sbloccare
2. Mantenere lo spinner "Caricamento..." fino a che **sia auth che ruoli** sono pronti
3. I layout non mostreranno più spinner perché i dati sono già disponibili

### Flusso Risultante

```text
App.tsx mount
    |
    v
[loading = true] → Spinner "Caricamento..."
    |
    v
supabase.auth.getSession()
    |
    ├─ No session → loading = false → /auth
    │
    └─ Session presente
            |
            v
        Fetch user_roles (in parallelo o sequenza veloce)
            |
            v
        [loading = false] → Render CoachLayout/AdminLayout
            |
            v
        UI finale (onboarding query parte, ma layout già visibile)
```

---

## Modifiche Tecniche

### 1. App.tsx - Pre-caricare ruoli prima di sbloccare

```typescript
// PRIMA (sblocca subito dopo getSession)
supabase.auth.getSession().then(({ data: { session } }) => {
  setUser(session?.user ?? null);
  setLoading(false); // ← sblocca subito
});

// DOPO (sblocca solo quando ruoli sono pronti)
supabase.auth.getSession().then(async ({ data: { session } }) => {
  const currentUser = session?.user ?? null;
  setUser(currentUser);
  
  if (currentUser) {
    // Pre-fetch ruoli prima di sbloccare
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id);
    
    // Popola React Query cache per useUserRoles
    queryClient.setQueryData(
      ["userRoles", currentUser.id], 
      roles?.map(r => r.role) || []
    );
    
    // Imposta isCoach (per CoachSessionInitializer)
    const hasCoachRole = roles?.some(r => r.role === 'coach') ?? false;
    setIsCoach(hasCoachRole);
  }
  
  setLoading(false); // ← sblocca DOPO ruoli pronti
});
```

**Nota chiave:** Popolare `queryClient.setQueryData(["userRoles", userId], ...)` fa sì che `useUserRoles()` nei layout trovi i dati già in cache, rendendo `query.isLoading = false` immediatamente.

### 2. CoachLayout - Rimuovere spinner separato

Poiché i ruoli sono già in cache quando il layout monta, `rolesLoading` sarà `false` fin dall'inizio.

```typescript
// PRIMA
if (rolesLoading) {
  return (
    <div className="...">
      <Spinner />
      <p>Verifica autorizzazioni...</p>
    </div>
  );
}

// DOPO
// Rimuovere questo blocco - i ruoli sono già pronti
// oppure mantenerlo come fallback (non verrà mai mostrato)
```

### 3. AdminLayout - Stesso trattamento

Rimuovere o semplificare il blocco `authLoading || rolesLoading`.

### 4. ClientAppLayout - Rimuovere spinner auth

Lo spinner `authLoading` non serve più perché App.tsx lo gestisce. Mantenere solo lo spinner per `clientLoading` (dati specifici client).

### 5. Clients.tsx - Onboarding spinner accettabile

Lo spinner `onboarding.isLoading` in `Clients.tsx` è accettabile perché:
- Appare **dopo** che la UI principale (topbar, sidebar) è già visibile
- È un loading locale del contenuto, non un blocco globale
- Dura ~50ms (RPC ottimizzata)

Può essere mantenuto così com'è o nascosto mostrando direttamente il contenuto quando disponibile.

---

## File Coinvolti

| File | Azione |
|------|--------|
| `src/App.tsx` | Modifica: pre-fetch ruoli + popola cache |
| `src/components/CoachLayout.tsx` | Modifica: rimuovere spinner separato |
| `src/components/admin/AdminLayout.tsx` | Modifica: semplificare loading check |
| `src/components/client/ClientAppLayout.tsx` | Modifica: rimuovere spinner auth |

---

## Vantaggi

| Metrica | Prima | Dopo |
|---------|-------|------|
| Spinner visibili | 3-4 | 1 |
| Transizioni UI | 3-4 | 1 |
| Flash bianchi | Possibili | Eliminati |
| Tempo percepito | Lungo (multi-step) | Breve (single-step) |

---

## Dettaglio Implementazione App.tsx

```typescript
// Auth state initialization - runs ONCE on mount
useEffect(() => {
  const initAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    
    setUser(currentUser);
    previousUserIdRef.current = currentUser?.id ?? null;
    
    if (currentUser) {
      // Pre-fetch ruoli e popola cache
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id);
      
      const roleStrings = roles?.map(r => r.role) || [];
      
      // Popola React Query cache → useUserRoles troverà dati già pronti
      queryClient.setQueryData(["userRoles", currentUser.id], roleStrings);
      
      // Imposta flag coach per session bridge
      const hasCoachRole = roleStrings.includes('coach');
      setIsCoach(hasCoachRole);
    }
    
    setLoading(false);
  };
  
  initAuth();
  
  // Subscription per cambi auth (logout, token refresh, etc.)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      const newUser = session?.user ?? null;
      
      if (previousUserIdRef.current !== (newUser?.id ?? null)) {
        queryClient.clear();
        previousUserIdRef.current = newUser?.id ?? null;
        
        if (newUser) {
          // Re-fetch ruoli per nuovo utente
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", newUser.id);
          
          const roleStrings = roles?.map(r => r.role) || [];
          queryClient.setQueryData(["userRoles", newUser.id], roleStrings);
          
          setIsCoach(roleStrings.includes('coach'));
        } else {
          setIsCoach(false);
        }
      }
      
      setUser(newUser);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

---

## Considerazioni Edge Case

1. **Errore fetch ruoli**: Se la query ruoli fallisce, si sblocca comunque con ruoli vuoti (fallback sicuro)
2. **Token scaduto**: Il listener `onAuthStateChange` gestisce il refresh e ri-popola i ruoli
3. **Logout**: `queryClient.clear()` pulisce la cache, inclusi i ruoli

---

## Risultato UX

L'utente vedrà:
1. **Spinner "Caricamento..."** (unico, ~200-300ms totali)
2. **UI completa** (sidebar + topbar + contenuto)

Nessun flash intermedio, nessuna transizione frammentata.
