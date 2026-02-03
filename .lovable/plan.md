
# Piano: Redirect Post-Login Intelligente per Dominio

## Contesto

L'app ha due entry point di autenticazione distinti:
- `/auth` → coach e admin
- `/client/auth` → client

Attualmente entrambe le pagine fanno redirect generici che causano doppi redirect e flash UI. Ogni auth page deve gestire solo i ruoli di sua competenza.

---

## Modifiche Tecniche

### 1. Nuovo Utility: `src/features/auth/utils/fetchUserRoles.ts`

Creare una funzione riutilizzabile per recuperare i ruoli dato un `userId`:

```text
fetchUserRoles(userId: string): Promise<AppRole[]>
```

Questa funzione:
- Interroga `user_roles` filtrando per `user_id`
- Ritorna array di ruoli o array vuoto in caso di errore
- Gestisce errori con console log ma non blocca il flusso

---

### 2. Modifica: `src/pages/Auth.tsx` (Coach/Admin)

**Logica redirect post-login:**

| Condizione | Redirect |
|------------|----------|
| `next` presente | `next` |
| Ha ruolo `coach` | `/` |
| Ha ruolo `admin` | `/admin` |
| Nessun ruolo valido | Resta su `/auth` + toast errore |

**Modifiche specifiche:**

a) **useEffect sessione esistente (righe 72-80):**
   - Dopo aver rilevato una sessione esistente
   - Recuperare i ruoli con `fetchUserRoles(session.user.id)`
   - Applicare logica redirect sopra descritta

b) **handleSignIn (righe 157-175):**
   - Dopo login riuscito, recuperare `data.user.id`
   - Recuperare i ruoli
   - Se ha `coach` o `admin` → redirect appropriato
   - Altrimenti → mostrare toast "Account non abilitato all'accesso coach" e non navigare

c) **Stato UI per errore accesso:**
   - Aggiungere stato `accessError` per mostrare messaggio inline se l'utente non ha ruoli coach/admin

---

### 3. Modifica: `src/pages/client/ClientAuth.tsx` (Client)

**Logica redirect post-login:**

| Condizione | Redirect |
|------------|----------|
| Ha ruolo `client` | `/client/app` |
| Non ha ruolo `client` | Resta su `/client/auth` + toast errore |

**Modifiche specifiche:**

a) **useEffect sessione esistente (righe 17-23):**
   - Dopo aver rilevato una sessione
   - Recuperare i ruoli
   - Se ha `client` → redirect a `/client/app`
   - Altrimenti → logout automatico + toast "Questa area e riservata ai clienti"

b) **handleSignIn (righe 25-43):**
   - Dopo login riuscito
   - Verificare ruolo `client`
   - Se non client → toast errore + logout

---

### 4. Modifica: `src/components/client/ClientAppLayout.tsx`

Aggiungere verifica ruolo `client` per coerenza con `CoachLayout`:

- Importare `useUserRoles`
- Dopo auth check, verificare `isClient`
- Se non client → redirect a `/client/auth`

Questo serve come guardrail di sicurezza, ma il redirect principale avviene gia nella auth page.

---

## Flusso Risultante

**Login da /auth (coach):**
```text
Login → fetch ruoli → isCoach? → /
                   → isAdmin? → /admin
                   → else → toast errore, resta
```

**Login da /client/auth (client):**
```text
Login → fetch ruoli → isClient? → /client/app
                   → else → logout + toast errore
```

---

## File Coinvolti

| File | Azione |
|------|--------|
| `src/features/auth/utils/fetchUserRoles.ts` | Nuovo |
| `src/pages/Auth.tsx` | Modifica |
| `src/pages/client/ClientAuth.tsx` | Modifica |
| `src/components/client/ClientAppLayout.tsx` | Modifica |

---

## Note di Sicurezza

- La logica frontend e solo UX/routing
- La vera protezione resta nelle RLS del database (`has_role`)
- I layout (`CoachLayout`, `AdminLayout`, `ClientAppLayout`) restano guardrail di backup
- Non si mescolano mai i domini delle due auth page
