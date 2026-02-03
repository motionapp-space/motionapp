

# Piano: Fix Spinner Infinito

## Problema Identificato

La funzione `initAuth()` in `App.tsx` non ha un blocco `try/catch/finally` per gestire errori. Se `supabase.auth.getSession()` o la query `user_roles` fallisce per qualsiasi motivo (rete, errore API, etc.), l'eccezione non viene gestita e `setLoading(false)` non viene mai chiamato, causando lo spinner infinito.

```typescript
// Codice attuale - PROBLEMATICO
const initAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession(); // ← Può fallire
  // ...
  if (currentUser) {
    const { data: roles } = await supabase.from("user_roles")...  // ← Può fallire
  }
  setLoading(false); // ← Non raggiunto se errore sopra
};
```

---

## Soluzione

Wrappare `initAuth()` in un blocco `try/catch/finally` per garantire che `setLoading(false)` venga **sempre** chiamato, anche in caso di errore.

---

## Modifica Tecnica

**File:** `src/App.tsx`

```typescript
const initAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    
    setUser(currentUser);
    previousUserIdRef.current = currentUser?.id ?? null;
    
    if (currentUser) {
      // Pre-fetch roles and populate React Query cache
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id);
      
      const roleStrings = roles?.map(r => r.role) || [];
      
      // Populate cache so useUserRoles() finds data immediately
      queryClient.setQueryData(["userRoles", currentUser.id], roleStrings);
      
      // Set coach flag for session bridge
      const hasCoachRole = roleStrings.includes('coach');
      setIsCoach(hasCoachRole);
    }
  } catch (error) {
    console.error("Auth initialization error:", error);
    // Reset to safe state on error
    setUser(null);
    setIsCoach(false);
  } finally {
    // SEMPRE sblocca il loading, anche in caso di errore
    setLoading(false);
  }
};
```

---

## File Coinvolti

| File | Azione |
|------|--------|
| `src/App.tsx` | Modifica: aggiungere try/catch/finally in initAuth() |

---

## Impatto

| Scenario | Prima | Dopo |
|----------|-------|------|
| Errore getSession() | Spinner infinito | Redirect a /auth (user = null) |
| Errore fetch ruoli | Spinner infinito | App funziona (ruoli vuoti) |
| Nessun errore | OK | OK (invariato) |

---

## Nota Aggiuntiva

Potrebbe essere utile anche aggiungere un timeout di sicurezza come fallback estremo, ma il `try/catch/finally` dovrebbe risolvere il problema nella maggior parte dei casi.

