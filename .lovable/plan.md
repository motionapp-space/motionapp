

# Piano: Proteggere le Route Coach con Verifica del Ruolo

## Problema Identificato

L'utente `matteo.devel@gmail.com` ha i ruoli `client` e `admin`, ma **non** ha il ruolo `coach`. Nonostante questo, riesce ad accedere all'area coach.

La causa: il `CoachLayout` attualmente controlla solo se l'utente e autenticato (`isAuthenticated`), ma non verifica se ha il ruolo `coach`.

## Soluzione

Modificare `CoachLayout` per verificare anche il ruolo `coach`, seguendo lo stesso pattern usato da `AdminLayout`.

---

## Modifiche Tecniche

### File: `src/components/CoachLayout.tsx`

1. **Importare** il hook `useUserRoles` da `@/features/auth/hooks/useUserRoles`

2. **Usare il hook** per ottenere `isCoach` e `isLoading`

3. **Aggiungere stato di loading** mentre verifica i ruoli

4. **Redirect** a una pagina appropriata se l'utente non e coach:
   - Se e solo `client` → redirect a `/client/app`
   - Altrimenti → redirect a `/auth`

### Logica di Redirect

```
Se non autenticato → /auth
Se autenticato ma non coach:
  - Se ha ruolo client → /client/app
  - Altrimenti → /auth
Se autenticato e coach → mostra contenuto
```

---

## Codice Previsto

```tsx
// src/components/CoachLayout.tsx
import { useUserRoles } from "@/features/auth/hooks/useUserRoles";

const CoachLayout = ({ isAuthenticated }: CoachLayoutProps) => {
  const { isCoach, isClient, isLoading: rolesLoading } = useUserRoles();
  
  // ... existing state ...

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Loading roles
  if (rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Verifica autorizzazioni...</p>
        </div>
      </div>
    );
  }

  // Not a coach - redirect appropriately
  if (!isCoach) {
    // If they're a client, send to client app
    if (isClient) {
      return <Navigate to="/client/app" replace />;
    }
    // Otherwise to auth
    return <Navigate to="/auth" replace />;
  }

  // ... rest of the component ...
};
```

---

## Pulizia Opzionale in App.tsx

Dopo questa modifica, il controllo `isCoach` in `App.tsx` (righe 87-106) diventa ridondante per la protezione delle route. Tuttavia puo essere mantenuto per il `CoachSessionInitializer`.

---

## Risultato

- Gli utenti senza ruolo `coach` non potranno accedere all'area coach
- I client verranno reindirizzati alla loro app dedicata
- Il comportamento e coerente con `AdminLayout`

