
Obiettivo: eliminare definitivamente qualsiasi “spinner infinito” (blocco totale app), mantenendo comunque il miglioramento visivo dello “spinner unico” quando tutto va bene.

---

## 1) Diagnosi probabile (perché è iniziato dopo l’unificazione)
Con l’ultimo cambiamento abbiamo iniziato ad “aspettare” (await) anche la query dei ruoli (`user_roles`) prima di togliere `loading` in `App.tsx`.

Se **quella richiesta resta appesa** (rete lenta, request bloccata, fetch che non ritorna, ecc.), allora:
- `setLoading(false)` non viene mai raggiunto (nonostante `try/finally`, perché il `finally` parte solo quando l’`await` termina)
- di conseguenza lo spinner globale “Caricamento…” può restare per sempre.

Questo spiega perché “non riesco più a utilizzare l’app” dopo l’unificazione: abbiamo messo una dipendenza di rete “critica” dentro al gate globale.

---

## 2) Fix principale: timeout reale alle chiamate Supabase (evita promesse appese)
### 2.1 Aggiungere un `fetch` con timeout al client Supabase
**File:** `src/integrations/supabase/client.ts`

- Configurare `createClient(..., { global: { fetch } })` con un wrapper che usa `AbortController` e abort dopo X secondi (es. 10s).
- Risultato: nessuna chiamata Supabase può rimanere appesa indefinitamente; al massimo fallisce con errore gestibile.

Motivo: risolve alla radice la categoria “richiesta che non torna mai”, che è ciò che produce spinner infiniti.

---

## 3) Fix di bootstrap: non bloccare l’app all’infinito per i ruoli
**File:** `src/App.tsx`

### 3.1 Separare “Auth ready” da “Roles ready”
- Continuare a fare `getSession()` all’avvio (con timeout).
- Avviare il prefetch ruoli, ma con una di queste strategie:
  1) **Attendere i ruoli solo fino a un massimo (soft-timeout)**: es. aspettiamo i ruoli max 1500–2000ms per mantenere lo spinner unico “quasi sempre”, poi sblocchiamo comunque l’app.
  2) Oppure: **non await dei ruoli** (fire-and-forget) e sbloccare subito dopo `getSession()`.

Consiglio: usare (1) per mantenere il beneficio visivo, ma senza rischio di blocco.

### 3.2 Implementazione “soft-timeout” (pattern)
- Creare una piccola utility `withTimeout(promise, ms)` (anche inline in App, ma meglio in `src/lib/withTimeout.ts`).
- In `initAuth`:
  - `await withTimeout(supabase.auth.getSession(), 5000)`
  - se c’è `currentUser`, fare prefetch ruoli con `await withTimeout(rolesFetchPromise, 1500)`:
    - se arriva in tempo: popolare cache React Query come adesso
    - se va in timeout/errore: **non bloccare**, lasciare che `useUserRoles()` faccia il fetch dopo (o che un retry manuale lo faccia)

### 3.3 Rendere robusto anche `onAuthStateChange`
Nel callback `onAuthStateChange`, wrappare il fetch ruoli in `try/catch` (oggi è `await` “nudo”):
- Evita unhandled rejections
- In caso di errore: set cache a `[]` *solo come fallback*, ma senza rompere la UI

---

## 4) Eliminare “schermate bianche” e gestire errori invece di restare in loading
Attualmente alcuni layout fanno `return null` in loading (Coach/Admin/Client). Se per qualsiasi motivo qualcosa resta in loading o fallisce, l’utente può percepire “blocco”.

### 4.1 Introdurre un componente loader unico riutilizzabile
**Nuovo componente (da creare in implementazione):**
- `src/components/common/FullScreenLoader.tsx` (o simile)
- Stesso stile dello spinner principale (titolo opzionale), così visivamente rimane “uno”.

### 4.2 Aggiornare layout
**Files:**
- `src/components/CoachLayout.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/components/client/ClientAppLayout.tsx`

Modifica:
- Sostituire `return null` durante `rolesLoading/authLoading` con `<FullScreenLoader message="Caricamento..." />`
- Aggiungere gestione errori “soft” (vedi punto 5) per evitare redirect sbagliati quando i ruoli non sono verificabili.

---

## 5) Ruoli: distinguere “nessun ruolo” da “errore nel recupero ruoli”
Oggi `fetchRolesForUser` ritorna `[]` su errore → il layout interpreta `[]` come “utente non coach/admin/client” e può redirigere fuori, anche se è solo un errore di rete.

### 5.1 Aggiungere una variante “strict” per React Query
**File:** `src/features/auth/api/roles.api.ts`
- Tenere `fetchRolesForUser()` (compatibilità, ritorna `[]` su errore)
- Aggiungere `fetchRolesForUserStrict()` che:
  - se c’è errore/timeout → `throw`
  - se ok → ritorna ruoli

### 5.2 Aggiornare `useUserRoles` per usare la strict e propagare `isError`
**File:** `src/features/auth/hooks/useUserRoles.ts`
- usare `fetchRolesForUserStrict`
- esporre `isError`, `error`, e magari `refetch`

### 5.3 Layout: se `isError` mostra schermata errore con “Riprova”
**Files:**
- `CoachLayout`, `AdminLayout`, `ClientAppLayout`

Comportamento:
- se `rolesLoading`: loader
- se `rolesError`: pagina “Impossibile verificare i permessi” + bottone “Riprova” (chiama `refetch()`), senza mandare l’utente al login automaticamente

Questo evita sia blocchi sia redirect errati.

---

## 6) Onboarding (Clients): evitare spinner infinito su RPC
**File:** `src/features/clients/hooks/useOnboardingState.ts`
- Wrappare `supabase.rpc(...)` con timeout (o contare sul fetch-timeout globale)
- Esporre `isError` e `error` dal query (attualmente non viene gestito nella pagina)

**File:** `src/pages/Clients.tsx`
- Oggi: se `onboarding.isLoading` → spinner full-page
- Aggiungere: se onboarding query `isError` → mostra un pannello con messaggio + “Riprova” (invalidate/refetch)

Risultato: anche se Supabase ha un problema, l’utente non resta “incastrato” su spinner per sempre.

---

## 7) Safety net: catturare errori async non gestiti (debug + UX)
**File:** `src/App.tsx`
- Aggiungere un `useEffect` con listener:
  - `window.addEventListener("unhandledrejection", ...)`
  - (opzionale) `window.addEventListener("error", ...)`
- Loggare l’errore e mostrare toast “Errore di connessione/inizializzazione” con invito a riprovare.
- Non serve per risolvere la causa primaria, ma aiuta a diagnosticare e impedisce “silenziosi” blocchi.

---

## 8) Sequenza di implementazione (rapida, per sbloccare subito l’app)
1) `supabase/client.ts`: fetch-timeout globale
2) `App.tsx`: soft-timeout su prefetch ruoli + try/catch anche in onAuthStateChange
3) Layout: sostituire `return null` con loader unico
4) `roles.api.ts` + `useUserRoles`: strict + gestione errori e “Riprova”
5) `useOnboardingState` + `Clients.tsx`: gestione errori (no spinner infinito)

---

## 9) Verifiche end-to-end (obbligatorie)
- Refresh pagina da utente già loggato (coach) → deve entrare senza blocchi
- Login coach → niente spinner infinito
- Navigazione su `/` (Clients), `/calendar`, `/library`, `/settings`
- Simulare rete lenta (DevTools throttling) → al massimo compare loader + poi UI / errore con “Riprova”, mai blocco infinito
- Client app `/client/app` → “Caricamento profilo…” deve finire o mostrare errore con retry, non restare infinito

---

## Impatto atteso
- Niente più blocchi totali: lo spinner non può rimanere infinito.
- Miglioramento UX: spinner “unico” nella maggior parte dei casi, ma con degradazione controllata (timeout) se rete/servizio è problematico.
- Diagnosi più veloce: errori async visibili e recuperabili via “Riprova”.
